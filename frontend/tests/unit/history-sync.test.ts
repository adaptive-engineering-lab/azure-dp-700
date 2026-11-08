import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useAppStore } from '../../src/lib/store';
import { pushSessions, startAttemptSync, RETRY_DELAYS_MS } from '../../src/lib/history/sync';

type UpsertResult = { error: { message: string } | null };

function mockClient(results: Array<UpsertResult | Promise<UpsertResult>>) {
  const upsert = vi.fn(() => {
    const next = results.length > 1 ? results.shift()! : results[0]!;
    return Promise.resolve(next);
  });
  const client = { from: vi.fn(() => ({ upsert })) } as unknown as SupabaseClient;
  return { client, upsert };
}

function record(ownerId: string | null, topic = 'Mod A') {
  return useAppStore.getState().recordSession({
    mode: 'mcq',
    topic,
    scorePct: 80,
    durationSeconds: 60,
    questionCount: 10,
    correctCount: 8,
    ownerId,
  });
}

describe('Attempt sync (FR-005, FR-006, FR-007)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useAppStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('pushSessions sends contract rows with ignoreDuplicates', async () => {
    const { client, upsert } = mockClient([{ error: null }]);
    const s = record('u1');
    await pushSessions(client, 'u1', [s]);
    expect(client.from).toHaveBeenCalledWith('sessions');
    expect(upsert).toHaveBeenCalledWith(
      [
        {
          id: s.id,
          user_id: 'u1',
          mode: 'mcq',
          topic: 'Mod A',
          score_pct: 80,
          question_count: 10,
          correct_count: 8,
          duration_seconds: 60,
          completed_at: s.completedAt,
        },
      ],
      { onConflict: 'id', ignoreDuplicates: true },
    );
  });

  it('pushSessions throws when the server returns an error', async () => {
    const { client } = mockClient([{ error: { message: 'boom' } }]);
    await expect(pushSessions(client, 'u1', [record('u1')])).rejects.toThrow(/boom/);
  });

  it("flushes only this user's pending sessions and marks them synced", async () => {
    const mine = record('u1');
    record(null); // guest
    record('u2'); // another account on this device
    const { client, upsert } = mockClient([{ error: null }]);

    const stop = startAttemptSync('u1', () => client);
    await vi.advanceTimersByTimeAsync(0);

    expect(upsert).toHaveBeenCalledTimes(1);
    const rows = (upsert.mock.calls[0] as unknown as [Array<{ id: string }>])[0];
    expect(rows.map((r) => r.id)).toEqual([mine.id]);
    const after = useAppStore.getState().sessions.find((s) => s.id === mine.id)!;
    expect(after.pendingSync).toBe(false);
    stop();
  });

  it('pushes a session recorded after sync started', async () => {
    const { client, upsert } = mockClient([{ error: null }]);
    const stop = startAttemptSync('u1', () => client);
    await vi.advanceTimersByTimeAsync(0);
    expect(upsert).not.toHaveBeenCalled();

    const s = record('u1');
    await vi.advanceTimersByTimeAsync(0);
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(useAppStore.getState().sessions.find((x) => x.id === s.id)!.pendingSync).toBe(false);
    stop();
  });

  it('retries after 5 s, 30 s, then every 120 s', async () => {
    record('u1');
    const fail = { error: { message: 'offline' } };
    const { client, upsert } = mockClient([fail]);
    const stop = startAttemptSync('u1', () => client);

    await vi.advanceTimersByTimeAsync(0);
    expect(upsert).toHaveBeenCalledTimes(1);

    const expectAfter = async (ms: number, calls: number) => {
      await vi.advanceTimersByTimeAsync(ms - 1);
      expect(upsert).toHaveBeenCalledTimes(calls - 1);
      await vi.advanceTimersByTimeAsync(1);
      expect(upsert).toHaveBeenCalledTimes(calls);
    };
    expect(RETRY_DELAYS_MS).toEqual([5_000, 30_000, 120_000]);
    await expectAfter(5_000, 2);
    await expectAfter(30_000, 3);
    await expectAfter(120_000, 4);
    await expectAfter(120_000, 5);
    stop();
  });

  it('flushes when the browser comes back online', async () => {
    record('u1');
    const { client, upsert } = mockClient([{ error: { message: 'offline' } }, { error: null }]);
    const stop = startAttemptSync('u1', () => client);
    await vi.advanceTimersByTimeAsync(0);
    expect(upsert).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(0);
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(useAppStore.getState().sessions[0]!.pendingSync).toBe(false);
    stop();
  });

  it('does not send again while a flush is already in flight', async () => {
    record('u1');
    let release!: (r: UpsertResult) => void;
    const slow = new Promise<UpsertResult>((r) => {
      release = r;
    });
    const { client, upsert } = mockClient([slow]);
    const stop = startAttemptSync('u1', () => client);
    await vi.advanceTimersByTimeAsync(0);

    window.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(0);
    expect(upsert).toHaveBeenCalledTimes(1);

    release({ error: null });
    await vi.advanceTimersByTimeAsync(0);
    expect(upsert).toHaveBeenCalledTimes(1);
    stop();
  });

  it('stops retrying once stopped', async () => {
    record('u1');
    const { client, upsert } = mockClient([{ error: { message: 'offline' } }]);
    const stop = startAttemptSync('u1', () => client);
    await vi.advanceTimersByTimeAsync(0);
    stop();
    await vi.advanceTimersByTimeAsync(300_000);
    window.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(0);
    expect(upsert).toHaveBeenCalledTimes(1);
  });
});

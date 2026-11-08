import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore, type GuestSession } from '../../src/lib/store';
import { SESSIONS_CAP } from '../../src/lib/store/sessions';

const server = (id: string, completedAt: string): GuestSession => ({
  id,
  mode: 'mcq',
  topic: 'Mod A',
  scorePct: 80,
  durationSeconds: 60,
  completedAt,
  questionCount: 10,
  correctCount: 8,
});

describe('Store: sessions sync state (feature 014)', () => {
  beforeEach(() => {
    useAppStore.getState().reset();
  });

  it('flags a session recorded while signed in as pending, with counts', () => {
    const s = useAppStore.getState().recordSession({
      mode: 'mcq',
      topic: 'Mod A',
      scorePct: 80,
      durationSeconds: 60,
      questionCount: 10,
      correctCount: 8,
      ownerId: 'u1',
    });
    expect(s).toMatchObject({ ownerId: 'u1', pendingSync: true, questionCount: 10, correctCount: 8 });
    expect(useAppStore.getState().sessions[0]).toEqual(s);
  });

  it('does not flag a guest session', () => {
    const s = useAppStore.getState().recordSession({
      mode: 'mcq',
      topic: null,
      scorePct: 50,
      durationSeconds: 30,
    });
    expect(s.pendingSync).toBeFalsy();
    expect(s.ownerId ?? null).toBeNull();
  });

  it('markSessionsSynced clears the flag and ignores unknown ids', () => {
    const s = useAppStore.getState().recordSession({
      mode: 'mcq',
      topic: 'Mod A',
      scorePct: 80,
      durationSeconds: 60,
      ownerId: 'u1',
    });
    useAppStore.getState().markSessionsSynced([s.id, 'not-a-session']);
    const [after] = useAppStore.getState().sessions;
    expect(after!.pendingSync).toBe(false);
    expect(useAppStore.getState().sessions).toHaveLength(1);
  });

  it('hydrate keeps a pending session the server does not have yet', () => {
    const pending = useAppStore.getState().recordSession({
      mode: 'mcq',
      topic: 'Mod B',
      scorePct: 90,
      durationSeconds: 60,
      ownerId: 'u1',
      now: new Date('2026-03-02T10:00:00Z'),
    });
    useAppStore.getState().hydrateFromServer({
      userId: 'u1',
      progress: {},
      sessions: [server('srv-1', '2026-03-03T10:00:00Z'), server('srv-2', '2026-03-01T10:00:00Z')],
    });
    const sessions = useAppStore.getState().sessions;
    expect(sessions.map((s) => s.id)).toEqual(['srv-1', pending.id, 'srv-2']);
    expect(sessions[1]!.pendingSync).toBe(true);
    expect(sessions[0]).toMatchObject({ ownerId: 'u1', pendingSync: false });
  });

  it('hydrate does not duplicate a pending session the server already has', () => {
    const pending = useAppStore.getState().recordSession({
      mode: 'mcq',
      topic: 'Mod B',
      scorePct: 90,
      durationSeconds: 60,
      ownerId: 'u1',
    });
    useAppStore.getState().hydrateFromServer({
      userId: 'u1',
      progress: {},
      sessions: [server(pending.id, pending.completedAt)],
    });
    const sessions = useAppStore.getState().sessions;
    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.pendingSync).toBe(false);
  });

  it('never drops a pending session when capping at SESSIONS_CAP', () => {
    const pending = useAppStore.getState().recordSession({
      mode: 'mcq',
      topic: 'Old',
      scorePct: 40,
      durationSeconds: 60,
      ownerId: 'u1',
      now: new Date('2020-01-01T00:00:00Z'),
    });
    const many = Array.from({ length: SESSIONS_CAP }, (_, i) =>
      server(`srv-${i}`, new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString()),
    );
    useAppStore.getState().hydrateFromServer({ userId: 'u1', progress: {}, sessions: many });
    const sessions = useAppStore.getState().sessions;
    expect(sessions).toHaveLength(SESSIONS_CAP);
    expect(sessions.some((s) => s.id === pending.id)).toBe(true);
  });
});

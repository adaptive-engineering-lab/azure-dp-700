import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { userClient } from '../../tools/test-helpers/clients.js';
import { createTestUser, cleanupTestUsers, type TestUser } from '../../tools/test-helpers/users.js';

/**
 * Feature 014: an attempt is written once however often it is sent (FR-007 /
 * SC-003), its counts are sane, and quiz_attempt_summaries rolls attempts up
 * per quiz with the mixed quiz counted on its own (FR-017 / SC-005).
 */
describe('Quiz history: attempt writes and per-quiz summaries', () => {
  let user: TestUser;
  let client: SupabaseClient;

  const at = (iso: string) => new Date(iso).toISOString();

  beforeAll(async () => {
    await cleanupTestUsers();
    user = await createTestUser('quiz-history');
    client = await userClient(user.email, user.password);
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  it('stores an attempt exactly once when the same id is sent twice', async () => {
    const row = {
      id: randomUUID(),
      user_id: user.id,
      mode: 'mcq',
      topic: 'Idempotent Mod',
      score_pct: 80,
      question_count: 10,
      correct_count: 8,
      duration_seconds: 120,
      completed_at: at('2026-01-01T10:00:00Z'),
    };
    for (let i = 0; i < 2; i += 1) {
      const { error } = await client
        .from('sessions')
        .upsert(row, { onConflict: 'id', ignoreDuplicates: true });
      expect(error, JSON.stringify(error)).toBeNull();
    }
    const { data, error } = await client.from('sessions').select('id').eq('id', row.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('rejects a correct count above the question count', async () => {
    const { error } = await client.from('sessions').insert({
      user_id: user.id,
      mode: 'mcq',
      topic: 'Bad Counts',
      score_pct: 100,
      question_count: 5,
      correct_count: 6,
    });
    expect(error).not.toBeNull();
  });

  it('rolls attempts up per quiz, counting the mixed quiz separately', async () => {
    const rows = [
      { topic: 'Mod A', score_pct: 60, completed_at: at('2026-02-01T10:00:00Z') },
      { topic: 'Mod A', score_pct: 85, completed_at: at('2026-02-02T10:00:00Z') },
      { topic: 'Mod A', score_pct: 70, completed_at: at('2026-02-03T10:00:00Z') },
      { topic: null, score_pct: 50, completed_at: at('2026-02-04T10:00:00Z') },
      { topic: null, score_pct: 90, completed_at: at('2026-02-05T10:00:00Z') },
    ].map((r) => ({ ...r, user_id: user.id, mode: 'mcq', question_count: 10, correct_count: 5 }));
    // A non-MCQ session on the same topic must not count.
    rows.push({
      topic: 'Mod A',
      score_pct: 100,
      completed_at: at('2026-02-06T10:00:00Z'),
      user_id: user.id,
      mode: 'code-review',
      question_count: 10,
      correct_count: 5,
    });
    const { error: insErr } = await client.from('sessions').insert(rows);
    expect(insErr, JSON.stringify(insErr)).toBeNull();

    const { data, error } = await client
      .from('quiz_attempt_summaries')
      .select('topic, attempt_count, best_score_pct, latest_score_pct, last_taken_at');
    expect(error).toBeNull();

    const modA = data!.find((r) => r.topic === 'Mod A');
    expect(modA).toMatchObject({ attempt_count: 3, best_score_pct: 85, latest_score_pct: 70 });
    expect(new Date(modA!.last_taken_at).toISOString()).toBe(at('2026-02-03T10:00:00Z'));

    const mixed = data!.find((r) => r.topic === null);
    expect(mixed).toMatchObject({ attempt_count: 2, best_score_pct: 90, latest_score_pct: 90 });
  });

  it('reports no best score for a quiz whose attempts have no score', async () => {
    const { error: insErr } = await client.from('sessions').insert([
      { user_id: user.id, mode: 'mcq', topic: 'Unscored', score_pct: null },
      { user_id: user.id, mode: 'mcq', topic: 'Unscored', score_pct: null },
    ]);
    expect(insErr, JSON.stringify(insErr)).toBeNull();

    const { data, error } = await client
      .from('quiz_attempt_summaries')
      .select('attempt_count, best_score_pct')
      .eq('topic', 'Unscored')
      .single();
    expect(error).toBeNull();
    expect(data).toEqual({ attempt_count: 2, best_score_pct: null });
  });
});

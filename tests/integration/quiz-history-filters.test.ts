import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { userClient } from '../../tools/test-helpers/clients.js';
import { createTestUser, cleanupTestUsers, type TestUser } from '../../tools/test-helpers/users.js';
import { fetchAttemptPage } from '../../frontend/src/lib/history/query.js';
import type { HistoryFilters } from '../../frontend/src/lib/history/types.js';

/**
 * Feature 014 SC-006: every combination of History filters returns exactly the
 * attempts that match all of them — checked against a plain filter of the
 * fixture rather than against the frontend's own predicate.
 */
describe('Quiz history filters against the database', () => {
  let user: TestUser;
  let client: SupabaseClient;
  const now = new Date();

  const daysAgo = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    d.setHours(12, 0, 0, 0);
    // Today at noon may still be ahead of `now`; keep every row in the past.
    return new Date(Math.min(d.getTime(), now.getTime() - 60_000)).toISOString();
  };

  const fixture = [
    { topic: 'Mod A', score_pct: 90, days: 0 },
    { topic: 'Mod A', score_pct: 70, days: 3 },
    { topic: 'Mod A', score_pct: 40, days: 10 },
    { topic: 'Mod A', score_pct: 85, days: 40 },
    { topic: 'Mod B', score_pct: 69, days: 0 },
    { topic: 'Mod B', score_pct: 100, days: 3 },
    { topic: 'Mod B', score_pct: null, days: 10 },
    { topic: null, score_pct: 55, days: 0 },
    { topic: null, score_pct: 75, days: 3 },
    { topic: null, score_pct: 20, days: 10 },
    { topic: null, score_pct: 95, days: 40 },
    { topic: null, score_pct: 70, days: 29 },
  ].map((r) => ({
    id: randomUUID(),
    mode: 'mcq',
    topic: r.topic,
    score_pct: r.score_pct,
    question_count: 10,
    correct_count: r.score_pct === null ? 0 : Math.round(r.score_pct / 10),
    duration_seconds: 60,
    completed_at: daysAgo(r.days),
  }));

  beforeAll(async () => {
    await cleanupTestUsers();
    user = await createTestUser('quiz-history-filters');
    client = await userClient(user.email, user.password);
    const { error } = await client
      .from('sessions')
      .insert(fixture.map((r) => ({ ...r, user_id: user.id })));
    if (error) throw new Error(`fixture insert failed: ${error.message}`);
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  function expected(f: HistoryFilters): string[] {
    const since =
      f.range === 'all'
        ? null
        : new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - ((f.range === '7d' ? 7 : 30) - 1),
          ).getTime();
    return fixture
      .filter((r) => f.quiz === undefined || r.topic === f.quiz)
      .filter((r) => since === null || Date.parse(r.completed_at) >= since)
      .filter((r) => {
        if (f.result === 'all') return true;
        if (r.score_pct === null) return false;
        return f.result === 'passed' ? r.score_pct >= 70 : r.score_pct < 70;
      })
      .sort((a, b) => Date.parse(b.completed_at) - Date.parse(a.completed_at))
      .map((r) => r.id);
  }

  const quizzes: HistoryFilters['quiz'][] = [undefined, null, 'Mod A'];
  const ranges: HistoryFilters['range'][] = ['7d', '30d', 'all'];
  const results: HistoryFilters['result'][] = ['all', 'passed', 'failed'];
  const combos = quizzes.flatMap((quiz) =>
    ranges.flatMap((range) => results.map((result) => ({ quiz, range, result }))),
  );

  it.each(combos)('quiz=$quiz range=$range result=$result', async (combo) => {
    const filters: HistoryFilters = { view: 'list', ...combo };
    const page = await fetchAttemptPage(client, user.id, filters, null, now);
    const got = page.rows.map((r) => r.id);
    // Same instant can't tie here, but compare as sets and then order.
    expect(new Set(got)).toEqual(new Set(expected(filters)));
    expect(got).toEqual(expected(filters));
    expect(page.hasMore).toBe(false);
  });
});

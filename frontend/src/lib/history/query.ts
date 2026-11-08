import type { SupabaseClient } from '@supabase/supabase-js';
import { PASS_MARK_PCT, HISTORY_PAGE_SIZE } from './types';
import type { HistoryFilters, QuizAttempt, QuizAttemptSummary } from './types';
import { rangeStart } from './rules';

// The client is always passed in, never imported from ../supabase: the
// integration suite calls these against a real local stack with a signed-in
// test client.

interface AttemptRow {
  id: string;
  topic: string | null;
  score_pct: number | null;
  question_count: number | null;
  correct_count: number | null;
  duration_seconds: number | null;
  completed_at: string;
}

/** The last row of a page. `id` breaks ties between attempts finished at the same instant. */
export interface AttemptCursor {
  completedAt: string;
  id: string;
}

export interface AttemptPage {
  rows: QuizAttempt[];
  hasMore: boolean;
  /** Pass back to fetch the next page; null when there is none. */
  nextCursor: AttemptCursor | null;
}

/** One page of the learner's MCQ attempts, newest first. */
export async function fetchAttemptPage(
  client: SupabaseClient,
  userId: string,
  filters: HistoryFilters,
  cursor: AttemptCursor | null,
  now: Date = new Date(),
): Promise<AttemptPage> {
  let q = client
    .from('sessions')
    .select('id, topic, score_pct, question_count, correct_count, duration_seconds, completed_at')
    .eq('user_id', userId)
    .eq('mode', 'mcq');

  if (filters.quiz === null) q = q.is('topic', null);
  else if (filters.quiz !== undefined) q = q.eq('topic', filters.quiz);
  const since = rangeStart(filters.range, now);
  if (since) q = q.gte('completed_at', since);
  // A null score matches neither, by design: there is nothing to judge.
  if (filters.result === 'passed') q = q.gte('score_pct', PASS_MARK_PCT);
  if (filters.result === 'failed') q = q.lt('score_pct', PASS_MARK_PCT);
  // Keyset, not offset: attempts finished while paging would shift an offset
  // and repeat rows. The cursor is (completed_at, id), not completed_at alone:
  // two attempts finished at the same instant either side of a page break
  // would otherwise lose the second one.
  if (cursor) {
    const at = `"${cursor.completedAt}"`;
    q = q.or(`completed_at.lt.${at},and(completed_at.eq.${at},id.lt.${cursor.id})`);
  }

  const { data, error } = await q
    .order('completed_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(HISTORY_PAGE_SIZE + 1);
  if (error) throw new Error(`load history failed: ${error.message}`);

  const all = (data ?? []) as AttemptRow[];
  const hasMore = all.length > HISTORY_PAGE_SIZE;
  const rows = all.slice(0, HISTORY_PAGE_SIZE).map(
    (r): QuizAttempt => ({
      id: r.id,
      topic: r.topic,
      scorePct: r.score_pct,
      questionCount: r.question_count,
      correctCount: r.correct_count,
      durationSeconds: r.duration_seconds,
      completedAt: r.completed_at,
      pending: false,
    }),
  );
  const last = rows[rows.length - 1];
  return {
    rows,
    hasMore,
    nextCursor: hasMore && last ? { completedAt: last.completedAt, id: last.id } : null,
  };
}

interface SummaryRow {
  topic: string | null;
  attempt_count: number;
  best_score_pct: number | null;
  latest_score_pct: number | null;
  last_taken_at: string;
}

/** Attempt count, best and latest score per quiz, most recently taken first. */
export async function fetchSummaries(
  client: SupabaseClient,
  userId: string,
): Promise<QuizAttemptSummary[]> {
  const { data, error } = await client
    .from('quiz_attempt_summaries')
    .select('topic, attempt_count, best_score_pct, latest_score_pct, last_taken_at')
    .eq('user_id', userId)
    .order('last_taken_at', { ascending: false });
  if (error) throw new Error(`load quiz summaries failed: ${error.message}`);
  return ((data ?? []) as SummaryRow[]).map((r) => ({
    topic: r.topic,
    attemptCount: r.attempt_count,
    bestScorePct: r.best_score_pct,
    latestScorePct: r.latest_score_pct,
    lastTakenAt: r.last_taken_at,
  }));
}

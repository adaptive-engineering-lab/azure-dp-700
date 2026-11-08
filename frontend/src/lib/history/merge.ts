import type { GuestSession } from '../store';
import { attemptResult, rangeStart, summaryKey } from './rules';
import type { HistoryFilters, QuizAttempt, QuizAttemptSummary } from './types';

export function sessionToAttempt(s: GuestSession): QuizAttempt {
  return {
    id: s.id,
    topic: s.topic,
    scorePct: s.scorePct,
    questionCount: s.questionCount ?? null,
    correctCount: s.correctCount ?? null,
    durationSeconds: s.durationSeconds,
    completedAt: s.completedAt,
    pending: !!s.pendingSync,
  };
}

/** The same predicate the server applies, for attempts it hasn't seen yet. */
export function matchesFilters(a: QuizAttempt, filters: HistoryFilters, now: Date): boolean {
  if (filters.quiz !== undefined && a.topic !== filters.quiz) return false;
  const since = rangeStart(filters.range, now);
  if (since && Date.parse(a.completedAt) < Date.parse(since)) return false;
  if (filters.result !== 'all' && attemptResult(a.scorePct) !== filters.result) return false;
  return true;
}

/**
 * Lay attempts still waiting to sync over the rows loaded from the server.
 *
 * A server row whose local copy is still flagged keeps the flag — the write
 * may have landed without the confirmation getting back. Pending attempts the
 * server hasn't returned are added if they match the filters; while more pages
 * remain, only those newer than the last loaded row, so an old pending attempt
 * appears where it belongs once that page loads instead of jumping to the end.
 */
export function mergePendingAttempts(
  serverRows: QuizAttempt[],
  pending: QuizAttempt[],
  filters: HistoryFilters,
  { hasMore, now = new Date() }: { hasMore: boolean; now?: Date },
): QuizAttempt[] {
  const pendingIds = new Set(pending.map((p) => p.id));
  const serverIds = new Set(serverRows.map((r) => r.id));
  const lowerBound = serverRows.length > 0 ? serverRows[serverRows.length - 1]!.completedAt : null;

  const merged = serverRows.map((r) => (pendingIds.has(r.id) ? { ...r, pending: true } : r));
  for (const p of pending) {
    if (serverIds.has(p.id)) continue;
    if (!matchesFilters(p, filters, now)) continue;
    if (hasMore && lowerBound && Date.parse(p.completedAt) < Date.parse(lowerBound)) continue;
    merged.push(p);
  }
  return merged.sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
}

/**
 * Per-quiz summaries from the server, plus attempts still on their way there,
 * keyed by `summaryKey`. The mixed quiz is its own entry.
 */
export function foldPendingIntoSummaries(
  summaries: QuizAttemptSummary[],
  pending: QuizAttempt[],
): Map<string, QuizAttemptSummary> {
  const map = new Map(summaries.map((s) => [summaryKey(s.topic), { ...s }]));
  for (const p of pending) {
    const key = summaryKey(p.topic);
    const s = map.get(key);
    if (!s) {
      map.set(key, {
        topic: p.topic,
        attemptCount: 1,
        bestScorePct: p.scorePct,
        latestScorePct: p.scorePct,
        lastTakenAt: p.completedAt,
      });
      continue;
    }
    s.attemptCount += 1;
    if (p.scorePct !== null && (s.bestScorePct === null || p.scorePct > s.bestScorePct)) {
      s.bestScorePct = p.scorePct;
    }
    if (Date.parse(p.completedAt) > Date.parse(s.lastTakenAt)) {
      s.latestScorePct = p.scorePct;
      s.lastTakenAt = p.completedAt;
    }
  }
  return map;
}

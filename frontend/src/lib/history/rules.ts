import { ALL_MODULES_KEY, ALL_MODULES_LABEL, PASS_MARK_PCT } from './types';
import type { AttemptResult, HistoryFilters } from './types';

export function attemptResult(scorePct: number | null): AttemptResult {
  if (scorePct === null) return null;
  return scorePct >= PASS_MARK_PCT ? 'passed' : 'failed';
}

const RANGE_DAYS = { '7d': 7, '30d': 30 } as const;

/**
 * Where a "last N days" window starts: local midnight N-1 days back, so the
 * window is today plus the previous N-1 calendar days. Built from local date
 * parts rather than by subtracting milliseconds, so a DST change in between
 * doesn't shift it by an hour.
 */
export function rangeStart(range: HistoryFilters['range'], now: Date = new Date()): string | null {
  if (range === 'all') return null;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (RANGE_DAYS[range] - 1));
  return start.toISOString();
}

/** Map key for a quiz: the module title, or the mixed quiz's sentinel. */
export function summaryKey(topic: string | null): string {
  return topic ?? ALL_MODULES_KEY;
}

export function quizLabel(topic: string | null): string {
  return topic ?? ALL_MODULES_LABEL;
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatCorrect(correct: number | null, total: number | null): string {
  if (correct === null || total === null) return '—';
  return `${correct}/${total}`;
}

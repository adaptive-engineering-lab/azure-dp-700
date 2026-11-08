/** Feature 014: quiz history. Shapes shared by the list, summaries and sync. */

/** A score at or above this passes — the DP-700 bar is 700/1000. */
export const PASS_MARK_PCT = 70;
export const HISTORY_PAGE_SIZE = 50;
/** URL / UI key for the mixed quiz, whose `topic` is null. */
export const ALL_MODULES_KEY = 'all-modules';
export const ALL_MODULES_LABEL = 'All modules';

export interface QuizAttempt {
  id: string;
  /** Module title; null is the mixed "All modules" quiz. */
  topic: string | null;
  scorePct: number | null;
  /** Null on attempts recorded before counts were stored. */
  questionCount: number | null;
  correctCount: number | null;
  durationSeconds: number | null;
  completedAt: string;
  /** Recorded on this device and not yet confirmed by the server. */
  pending: boolean;
}

/** Null when the attempt has no score to judge. */
export type AttemptResult = 'passed' | 'failed' | null;

export interface QuizAttemptSummary {
  topic: string | null;
  attemptCount: number;
  bestScorePct: number | null;
  latestScorePct: number | null;
  lastTakenAt: string;
}

export interface HistoryFilters {
  view: 'list' | 'by-quiz';
  /** undefined = any quiz; null = All modules; string = that module. */
  quiz: string | null | undefined;
  range: '7d' | '30d' | 'all';
  result: 'all' | 'passed' | 'failed';
}

export const DEFAULT_HISTORY_FILTERS: HistoryFilters = {
  view: 'list',
  quiz: undefined,
  range: 'all',
  result: 'all',
};

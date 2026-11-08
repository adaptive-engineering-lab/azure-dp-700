import { describe, it, expect } from 'vitest';
import {
  foldPendingIntoSummaries,
  mergePendingAttempts,
  sessionToAttempt,
} from '../../src/lib/history/merge';
import {
  DEFAULT_HISTORY_FILTERS,
  type QuizAttempt,
  type QuizAttemptSummary,
} from '../../src/lib/history/types';

const attempt = (id: string, completedAt: string, over: Partial<QuizAttempt> = {}): QuizAttempt => ({
  id,
  topic: 'Mod A',
  scorePct: 80,
  questionCount: 10,
  correctCount: 8,
  durationSeconds: 60,
  completedAt,
  pending: false,
  ...over,
});

const NOW = new Date('2026-06-15T12:00:00Z');

describe('mergePendingAttempts (FR-016, FR-021)', () => {
  it('dedupes by id and keeps the pending flag while the local copy is flagged', () => {
    const server = [attempt('a', '2026-06-14T10:00:00Z')];
    const pending = [attempt('a', '2026-06-14T10:00:00Z', { pending: true })];
    const merged = mergePendingAttempts(server, pending, DEFAULT_HISTORY_FILTERS, {
      hasMore: false,
      now: NOW,
    });
    expect(merged).toHaveLength(1);
    expect(merged[0]!.pending).toBe(true);
  });

  it('adds pending attempts the server has not returned, newest first', () => {
    const server = [attempt('s1', '2026-06-14T10:00:00Z'), attempt('s2', '2026-06-10T10:00:00Z')];
    const pending = [attempt('p1', '2026-06-15T09:00:00Z', { pending: true })];
    const merged = mergePendingAttempts(server, pending, DEFAULT_HISTORY_FILTERS, {
      hasMore: false,
      now: NOW,
    });
    expect(merged.map((a) => a.id)).toEqual(['p1', 's1', 's2']);
  });

  it('holds back pending attempts older than the loaded page while more pages remain', () => {
    const server = [attempt('s1', '2026-06-14T10:00:00Z')];
    const pending = [attempt('old', '2026-01-01T00:00:00Z', { pending: true })];
    expect(
      mergePendingAttempts(server, pending, DEFAULT_HISTORY_FILTERS, { hasMore: true, now: NOW }),
    ).toHaveLength(1);
    expect(
      mergePendingAttempts(server, pending, DEFAULT_HISTORY_FILTERS, { hasMore: false, now: NOW }),
    ).toHaveLength(2);
  });

  it('leaves out pending attempts that do not match the filters', () => {
    const pending = [
      attempt('mixed', '2026-06-15T09:00:00Z', { topic: null, pending: true }),
      attempt('modB', '2026-06-15T08:00:00Z', { topic: 'Mod B', pending: true }),
      attempt('fail', '2026-06-15T07:00:00Z', { topic: null, scorePct: 40, pending: true }),
      attempt('old', '2026-05-01T07:00:00Z', { topic: null, pending: true }),
    ];
    const merged = mergePendingAttempts([], pending, {
      ...DEFAULT_HISTORY_FILTERS,
      quiz: null,
      range: '7d',
      result: 'passed',
    }, { hasMore: false, now: NOW });
    expect(merged.map((a) => a.id)).toEqual(['mixed']);
  });
});

describe('sessionToAttempt', () => {
  it('maps a stored session, treating missing counts as unknown', () => {
    expect(
      sessionToAttempt({
        id: 'x',
        mode: 'mcq',
        topic: null,
        scorePct: 50,
        durationSeconds: 30,
        completedAt: '2026-06-01T00:00:00Z',
        pendingSync: true,
      }),
    ).toEqual({
      id: 'x',
      topic: null,
      scorePct: 50,
      questionCount: null,
      correctCount: null,
      durationSeconds: 30,
      completedAt: '2026-06-01T00:00:00Z',
      pending: true,
    });
  });
});

describe('foldPendingIntoSummaries (FR-017, FR-021)', () => {
  const summary = (topic: string | null, over: Partial<QuizAttemptSummary> = {}): QuizAttemptSummary => ({
    topic,
    attemptCount: 2,
    bestScorePct: 75,
    latestScorePct: 60,
    lastTakenAt: '2026-06-10T10:00:00Z',
    ...over,
  });

  it('adds a newer pending attempt to its quiz', () => {
    const map = foldPendingIntoSummaries(
      [summary('Mod A')],
      [attempt('p', '2026-06-12T10:00:00Z', { scorePct: 90, pending: true })],
    );
    expect(map.get('Mod A')).toEqual({
      topic: 'Mod A',
      attemptCount: 3,
      bestScorePct: 90,
      latestScorePct: 90,
      lastTakenAt: '2026-06-12T10:00:00Z',
    });
  });

  it('keeps latest when the pending attempt is older, and best when it scores lower', () => {
    const map = foldPendingIntoSummaries(
      [summary('Mod A')],
      [attempt('p', '2026-06-01T10:00:00Z', { scorePct: 50, pending: true })],
    );
    expect(map.get('Mod A')).toMatchObject({ attemptCount: 3, bestScorePct: 75, latestScorePct: 60 });
  });

  it('creates a summary for a quiz the server has none for', () => {
    const map = foldPendingIntoSummaries([], [attempt('p', '2026-06-12T10:00:00Z', { pending: true })]);
    expect(map.get('Mod A')).toMatchObject({ attemptCount: 1, bestScorePct: 80, latestScorePct: 80 });
  });

  it('counts an unscored attempt without touching best', () => {
    const map = foldPendingIntoSummaries(
      [summary('Mod A')],
      [attempt('p', '2026-06-12T10:00:00Z', { scorePct: null, pending: true })],
    );
    expect(map.get('Mod A')).toMatchObject({ attemptCount: 3, bestScorePct: 75, latestScorePct: null });
  });

  it('folds a mixed-quiz attempt into All modules only', () => {
    const map = foldPendingIntoSummaries(
      [summary('Mod A'), summary(null, { attemptCount: 1 })],
      [attempt('p', '2026-06-12T10:00:00Z', { topic: null, pending: true })],
    );
    expect(map.get('all-modules')!.attemptCount).toBe(2);
    expect(map.get('Mod A')!.attemptCount).toBe(2);
  });
});

import { describe, it, expect, afterEach } from 'vitest';
import {
  attemptResult,
  rangeStart,
  summaryKey,
  quizLabel,
  formatDuration,
  formatCorrect,
} from '../../src/lib/history/rules';

// Node re-reads TZ on change, which lets one test pin a zone. The frontend
// has no Node types, hence the cast.
const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } })
  .process.env;

describe('History rules (FR-003, FR-012, FR-022)', () => {
  const originalTz = env.TZ;
  afterEach(() => {
    // Assigning undefined would store the string "undefined".
    if (originalTz === undefined) delete env.TZ;
    else env.TZ = originalTz;
  });

  it('passes at 70% and above, fails below, and has no result without a score', () => {
    expect(attemptResult(70)).toBe('passed');
    expect(attemptResult(100)).toBe('passed');
    expect(attemptResult(69.5)).toBe('failed');
    expect(attemptResult(0)).toBe('failed');
    expect(attemptResult(null)).toBeNull();
  });

  it('starts "last N days" at local midnight N-1 days back', () => {
    env.TZ = 'UTC';
    const now = new Date('2026-06-15T18:30:00Z');
    expect(rangeStart('all', now)).toBeNull();
    expect(rangeStart('7d', now)).toBe('2026-06-09T00:00:00.000Z');
    expect(rangeStart('30d', now)).toBe('2026-05-17T00:00:00.000Z');
  });

  it('uses the local offset of the start day across a DST change', () => {
    env.TZ = 'America/New_York';
    // DST began 2026-03-08; "now" is in EDT, the window starts in EST.
    const now = new Date('2026-03-10T16:00:00Z');
    expect(rangeStart('7d', now)).toBe('2026-03-04T05:00:00.000Z');
  });

  it('keys and labels the mixed quiz as All modules', () => {
    expect(summaryKey(null)).toBe('all-modules');
    expect(summaryKey('Mod A')).toBe('Mod A');
    expect(quizLabel(null)).toBe('All modules');
    expect(quizLabel('Mod A')).toBe('Mod A');
  });

  it('formats duration as m:ss and correct as c/q, with — when unknown', () => {
    expect(formatDuration(125)).toBe('2:05');
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(null)).toBe('—');
    expect(formatCorrect(8, 10)).toBe('8/10');
    expect(formatCorrect(null, 10)).toBe('—');
    expect(formatCorrect(8, null)).toBe('—');
  });
});

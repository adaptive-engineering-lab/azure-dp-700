import { describe, it, expect } from 'vitest';
import { parseHistoryParams, toHistoryParams, isDefaultFilters } from '../../src/lib/history/params';
import { DEFAULT_HISTORY_FILTERS, type HistoryFilters } from '../../src/lib/history/types';

describe('History URL params (FR-024)', () => {
  it('reads an empty query as the defaults', () => {
    expect(parseHistoryParams(new URLSearchParams(''))).toEqual(DEFAULT_HISTORY_FILTERS);
  });

  it('reads all-modules as the mixed quiz', () => {
    expect(parseHistoryParams(new URLSearchParams('quiz=all-modules')).quiz).toBeNull();
  });

  it('falls back to defaults for unknown values', () => {
    const f = parseHistoryParams(new URLSearchParams('view=grid&range=1y&result=maybe&quiz='));
    expect(f).toEqual(DEFAULT_HISTORY_FILTERS);
  });

  it('omits defaults when writing', () => {
    expect(toHistoryParams(DEFAULT_HISTORY_FILTERS).toString()).toBe('');
  });

  it.each<Partial<HistoryFilters>>([
    { quiz: null },
    { quiz: 'Get started with lakehouses' },
    { quiz: 'Ingest & transform', range: '30d', result: 'failed' },
    { view: 'by-quiz' },
    { range: '7d', result: 'passed' },
  ])('round-trips %o', (partial) => {
    const filters = { ...DEFAULT_HISTORY_FILTERS, ...partial };
    const parsed = parseHistoryParams(new URLSearchParams(toHistoryParams(filters).toString()));
    expect(parsed).toEqual(filters);
  });

  it('tells defaults apart from active filters, ignoring the view', () => {
    expect(isDefaultFilters(DEFAULT_HISTORY_FILTERS)).toBe(true);
    expect(isDefaultFilters({ ...DEFAULT_HISTORY_FILTERS, view: 'by-quiz' })).toBe(true);
    expect(isDefaultFilters({ ...DEFAULT_HISTORY_FILTERS, result: 'failed' })).toBe(false);
    expect(isDefaultFilters({ ...DEFAULT_HISTORY_FILTERS, quiz: null })).toBe(false);
  });
});

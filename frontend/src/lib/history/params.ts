import { ALL_MODULES_KEY, DEFAULT_HISTORY_FILTERS } from './types';
import type { HistoryFilters } from './types';

const VIEWS: readonly HistoryFilters['view'][] = ['list', 'by-quiz'];
const RANGES: readonly HistoryFilters['range'][] = ['7d', '30d', 'all'];
const RESULTS: readonly HistoryFilters['result'][] = ['all', 'passed', 'failed'];

function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** Read History's filters from the URL. Unknown values fall back to defaults. */
export function parseHistoryParams(params: URLSearchParams): HistoryFilters {
  const quiz = params.get('quiz');
  return {
    view: pick(params.get('view'), VIEWS, DEFAULT_HISTORY_FILTERS.view),
    quiz: !quiz ? undefined : quiz === ALL_MODULES_KEY ? null : quiz,
    range: pick(params.get('range'), RANGES, DEFAULT_HISTORY_FILTERS.range),
    result: pick(params.get('result'), RESULTS, DEFAULT_HISTORY_FILTERS.result),
  };
}

/** Write History's filters to the URL, leaving defaults out. */
export function toHistoryParams(filters: HistoryFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.view !== DEFAULT_HISTORY_FILTERS.view) p.set('view', filters.view);
  if (filters.quiz !== undefined) p.set('quiz', filters.quiz ?? ALL_MODULES_KEY);
  if (filters.range !== DEFAULT_HISTORY_FILTERS.range) p.set('range', filters.range);
  if (filters.result !== DEFAULT_HISTORY_FILTERS.result) p.set('result', filters.result);
  return p;
}

/** True when no filter narrows the list. The view is not a filter. */
export function isDefaultFilters(filters: HistoryFilters): boolean {
  return (
    filters.quiz === undefined &&
    filters.range === DEFAULT_HISTORY_FILTERS.range &&
    filters.result === DEFAULT_HISTORY_FILTERS.result
  );
}

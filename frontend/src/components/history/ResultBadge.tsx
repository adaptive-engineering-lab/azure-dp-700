import type { AttemptResult } from '../../lib/history/types';

/**
 * Passed / Failed against the pass mark. The word carries the meaning; the
 * glyph and colour only reinforce it, so it reads the same without colour.
 */
export function ResultBadge({ result }: { result: AttemptResult }) {
  if (result === null) return null;
  const passed = result === 'passed';
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1',
        passed ? 'text-success ring-success/40' : 'text-error ring-error/40',
      ].join(' ')}
    >
      <span aria-hidden>{passed ? '✓' : '✕'}</span>
      {passed ? 'Passed' : 'Failed'}
    </span>
  );
}

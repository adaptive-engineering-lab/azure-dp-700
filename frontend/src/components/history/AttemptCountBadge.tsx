import type { QuizAttemptSummary } from '../../lib/history/types';

/** "Taken 3× · best 85%" under a quiz in the picker; nothing if never taken. */
export function AttemptCountBadge({ summary }: { summary?: QuizAttemptSummary }) {
  if (!summary) return null;
  const best =
    summary.bestScorePct === null ? '' : ` · best ${Math.round(summary.bestScorePct)}%`;
  return (
    <span className="mt-0.5 block text-xs opacity-80">
      Taken {summary.attemptCount}×{best}
    </span>
  );
}

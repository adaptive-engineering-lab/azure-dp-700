import { attemptResult, formatCorrect, formatDuration, quizLabel } from '../../lib/history/rules';
import type { QuizAttempt } from '../../lib/history/types';
import { ResultBadge } from './ResultBadge';

export function AttemptRow({ attempt }: { attempt: QuizAttempt }) {
  const when = new Date(attempt.completedAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return (
    <li className="rounded-lg bg-bg-elevated p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium">{quizLabel(attempt.topic)}</p>
        <ResultBadge result={attemptResult(attempt.scorePct)} />
      </div>
      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-fg-muted">
        <span className="font-semibold text-fg tabular-nums">
          {attempt.scorePct === null ? '—' : `${Math.round(attempt.scorePct)}%`}
        </span>
        <span className="tabular-nums">
          <span className="sr-only">Correct: </span>
          {formatCorrect(attempt.correctCount, attempt.questionCount)}
        </span>
        <span className="tabular-nums">
          <span className="sr-only">Duration: </span>
          {formatDuration(attempt.durationSeconds)}
        </span>
        <time dateTime={attempt.completedAt}>{when}</time>
        {attempt.pending && <span className="italic">Not yet synced</span>}
      </p>
    </li>
  );
}

import { Link } from 'react-router-dom';
import { ROUTES } from '../../lib/routes';
import { toHistoryParams } from '../../lib/history/params';
import { quizLabel } from '../../lib/history/rules';
import { DEFAULT_HISTORY_FILTERS, type QuizAttemptSummary } from '../../lib/history/types';

const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v)}%`);

/** One quiz in the "By quiz" view; opens that quiz's attempts. */
export function QuizSummaryRow({ summary }: { summary: QuizAttemptSummary }) {
  const query = toHistoryParams({ ...DEFAULT_HISTORY_FILTERS, quiz: summary.topic });
  const href = `${ROUTES.history}?${query}`;
  const lastTaken = new Date(summary.lastTakenAt).toLocaleDateString(undefined, {
    dateStyle: 'medium',
  });
  return (
    <li>
      <Link to={href} className="block rounded-lg bg-bg-elevated p-3 hover:ring-1 hover:ring-divider">
        <p className="font-medium">{quizLabel(summary.topic)}</p>
        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-fg-muted">
          <span className="font-semibold text-fg">Taken {summary.attemptCount}×</span>
          <span>Best {pct(summary.bestScorePct)}</span>
          <span>Latest {pct(summary.latestScorePct)}</span>
          <span>
            Last taken <time dateTime={summary.lastTakenAt}>{lastTaken}</time>
          </span>
        </p>
      </Link>
    </li>
  );
}

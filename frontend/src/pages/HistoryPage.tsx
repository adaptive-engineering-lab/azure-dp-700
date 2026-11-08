import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth/AuthProvider';
import { ROUTES } from '../lib/routes';
import { isDefaultFilters, parseHistoryParams, toHistoryParams } from '../lib/history/params';
import { quizLabel, summaryKey } from '../lib/history/rules';
import { DEFAULT_HISTORY_FILTERS } from '../lib/history/types';
import type { HistoryFilters, QuizAttemptSummary } from '../lib/history/types';
import { useAttemptHistory } from '../lib/history/useAttemptHistory';
import { useQuizSummaries } from '../lib/history/useQuizSummaries';
import { AttemptRow } from '../components/history/AttemptRow';
import { QuizSummaryRow } from '../components/history/QuizSummaryRow';
import { HistoryFilters as FiltersBar } from '../components/history/HistoryFilters';

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseHistoryParams(searchParams);
  // Filter tweaks replace the entry so Back leaves the page, not the filter.
  const setFilters = (next: HistoryFilters) =>
    setSearchParams(toHistoryParams(next), { replace: true });

  return (
    <section className="mx-auto w-full max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">History</h1>
        <p className="mt-1 text-fg-muted">Every quiz you've finished, newest first.</p>
      </header>

      {authLoading ? (
        <p className="text-fg-muted">Loading…</p>
      ) : !user ? (
        <SignInPrompt />
      ) : (
        <SignedInHistory userId={user.id} filters={filters} setFilters={setFilters} />
      )}
    </section>
  );
}

function SignInPrompt() {
  return (
    <div className="rounded-lg bg-bg-elevated p-4">
      <p>Your quiz history is saved to your account.</p>
      <p className="mt-1 text-sm text-fg-muted">
        Sign in to see every quiz you've finished, on any device.
      </p>
      <Link
        to={ROUTES.signIn}
        className="mt-4 inline-flex rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg"
      >
        Sign in
      </Link>
    </div>
  );
}

function SignedInHistory({
  userId,
  filters,
  setFilters,
}: {
  userId: string;
  filters: HistoryFilters;
  setFilters: (next: HistoryFilters) => void;
}) {
  const { summaries, loading, error } = useQuizSummaries(userId);

  return (
    <>
      <div role="group" aria-label="View" className="mb-4 flex gap-2 rounded-lg bg-bg-elevated p-1">
        <ViewButton
          active={filters.view === 'list'}
          onClick={() => setFilters({ ...filters, view: 'list' })}
        >
          Attempts
        </ViewButton>
        <ViewButton
          active={filters.view === 'by-quiz'}
          onClick={() => setFilters({ ...filters, view: 'by-quiz' })}
        >
          By quiz
        </ViewButton>
      </div>

      {filters.view === 'by-quiz' ? (
        <ByQuiz summaries={[...summaries.values()]} loading={loading} error={error} />
      ) : (
        <>
          <FiltersBar
            filters={filters}
            quizOptions={[...summaries.values()]
              .map((q) => ({ key: summaryKey(q.topic), label: quizLabel(q.topic) }))
              .sort((a, b) => a.label.localeCompare(b.label))}
            onChange={setFilters}
          />
          <AttemptList
            userId={userId}
            filters={filters}
            onClearFilters={() => setFilters(DEFAULT_HISTORY_FILTERS)}
          />
        </>
      )}
    </>
  );
}

function ViewButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'flex-1 rounded-md px-3 py-2 text-sm font-medium',
        active ? 'bg-accent text-accent-fg' : 'text-fg',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function ByQuiz({
  summaries,
  loading,
  error,
}: {
  summaries: QuizAttemptSummary[];
  loading: boolean;
  error: string | null;
}) {
  const sorted = [...summaries].sort(
    (a, b) => Date.parse(b.lastTakenAt) - Date.parse(a.lastTakenAt),
  );
  if (error) {
    return (
      <p role="alert" className="text-sm text-error">
        {error}
      </p>
    );
  }
  if (sorted.length === 0) {
    return loading ? <p className="text-fg-muted">Loading…</p> : <NoAttempts />;
  }
  return (
    <ul className="flex flex-col gap-2" aria-label="Quizzes taken">
      {sorted.map((s) => (
        <QuizSummaryRow key={s.topic ?? ''} summary={s} />
      ))}
    </ul>
  );
}

function NoAttempts() {
  return (
    <div className="rounded-lg bg-bg-elevated p-4">
      <p>No quizzes finished yet.</p>
      <p className="mt-1 text-sm text-fg-muted">Each quiz you complete will be listed here.</p>
      <Link
        to={ROUTES.quiz}
        className="mt-4 inline-flex rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg"
      >
        Start a quiz
      </Link>
    </div>
  );
}

function AttemptList({
  userId,
  filters,
  onClearFilters,
}: {
  userId: string;
  filters: HistoryFilters;
  onClearFilters: () => void;
}) {
  const { attempts, loading, error, hasMore, loadMore, retry } = useAttemptHistory(userId, filters);

  return (
    <>
      {error && (
        <p role="alert" className="mb-4 text-sm text-error">
          {error}{' '}
          <button type="button" className="underline" onClick={retry}>
            Retry
          </button>
        </p>
      )}

      {attempts.length === 0 &&
        !loading &&
        !error &&
        (isDefaultFilters(filters) ? (
          <NoAttempts />
        ) : (
          <div className="rounded-lg bg-bg-elevated p-4">
            <p>No attempts match these filters.</p>
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-3 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg"
            >
              Clear filters
            </button>
          </div>
        ))}

      {attempts.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Quiz attempts">
          {attempts.map((a) => (
            <AttemptRow key={a.id} attempt={a} />
          ))}
        </ul>
      )}

      {loading && <p className="mt-4 text-fg-muted">Loading…</p>}

      {hasMore && !loading && (
        <button
          type="button"
          onClick={loadMore}
          className="mt-4 w-full rounded-md bg-bg-elevated px-4 py-3 text-sm font-semibold"
        >
          Load more
        </button>
      )}
    </>
  );
}

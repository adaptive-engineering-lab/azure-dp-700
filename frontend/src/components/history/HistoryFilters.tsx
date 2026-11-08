import { useId } from 'react';
import { ALL_MODULES_KEY, ALL_MODULES_LABEL } from '../../lib/history/types';
import type { HistoryFilters as Filters } from '../../lib/history/types';

const ANY_QUIZ = '';

export interface QuizOption {
  key: string;
  label: string;
}

/** Quiz, date range and result. Native selects: keyboard and screen reader for free. */
export function HistoryFilters({
  filters,
  quizOptions,
  onChange,
}: {
  filters: Filters;
  quizOptions: QuizOption[];
  onChange: (next: Filters) => void;
}) {
  const id = useId();
  const quizValue =
    filters.quiz === undefined ? ANY_QUIZ : filters.quiz === null ? ALL_MODULES_KEY : filters.quiz;
  // Keep a quiz from the URL selectable even before the summaries load.
  const options =
    quizValue !== ANY_QUIZ && !quizOptions.some((o) => o.key === quizValue)
      ? [...quizOptions, { key: quizValue, label: filters.quiz ?? ALL_MODULES_LABEL }]
      : quizOptions;

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg bg-bg-elevated p-3 sm:grid-cols-3">
      <Field id={`${id}-quiz`} label="Quiz">
        <select
          id={`${id}-quiz`}
          value={quizValue}
          onChange={(e) => {
            const v = e.target.value;
            onChange({
              ...filters,
              quiz: v === ANY_QUIZ ? undefined : v === ALL_MODULES_KEY ? null : v,
            });
          }}
          className={SELECT}
        >
          <option value={ANY_QUIZ}>Any quiz</option>
          {options.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>

      <Field id={`${id}-range`} label="Date range">
        <select
          id={`${id}-range`}
          value={filters.range}
          onChange={(e) => onChange({ ...filters, range: e.target.value as Filters['range'] })}
          className={SELECT}
        >
          <option value="all">All time</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      </Field>

      <Field id={`${id}-result`} label="Result">
        <select
          id={`${id}-result`}
          value={filters.result}
          onChange={(e) => onChange({ ...filters, result: e.target.value as Filters['result'] })}
          className={SELECT}
        >
          <option value="all">All</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
        </select>
      </Field>
    </div>
  );
}

const SELECT = 'mt-1 w-full rounded-md bg-bg px-3 py-2 text-sm text-fg ring-1 ring-divider';

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold text-fg-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

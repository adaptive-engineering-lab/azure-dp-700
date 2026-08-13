import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useModules } from '../lib/questions/useModules';
import { selectionFromParams, selectionLabel, selectionParams } from '../lib/questions/selection';
import type { Selection } from '../lib/questions/selection';
import { ROUTES } from '../lib/routes';
import { supabase } from '../lib/supabase';

const COUNTS = [5, 10, 20] as const;

export default function QuizSelectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { modules, paths, loading: modulesLoading } = useModules('mcq');
  const [selection, setSelection] = useState<Selection>(() => selectionFromParams(searchParams));
  const [count, setCount] = useState<5 | 10 | 20>(10);
  const [poolSize, setPoolSize] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let query = supabase().from('questions').select('id', { count: 'exact', head: true }).eq('type', 'mcq');
    if (selection.kind === 'module') query = query.eq('topic', selection.topic);
    if (selection.kind === 'path') query = query.contains('tags', [`path:${selection.id}`]);
    query.then(({ count: n }) => {
      if (!cancelled) setPoolSize(n ?? 0);
    });
    return () => {
      cancelled = true;
    };
  }, [selection]);

  const willDeliver = poolSize === null ? null : Math.min(poolSize, count);
  const scope = selectionLabel(selection, 'all modules');

  function start() {
    const p = new URLSearchParams({ count: String(count) });
    for (const [k, v] of selectionParams(selection)) p.set(k, v);
    navigate(`${ROUTES.quiz}/session?${p.toString()}`);
  }

  return (
    <section className="mx-auto w-full max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Quiz</h1>
        <p className="mt-1 text-fg-muted">Multiple choice with explanations. Pick your settings.</p>
      </header>

      <Fieldset legend="Module">
        <div className="grid grid-cols-1 gap-2">
          {modules.map((m) => (
            <Pill
              key={m.topic}
              active={selection.kind === 'module' && selection.topic === m.topic}
              onClick={() => setSelection({ kind: 'module', topic: m.topic })}
              align="left"
            >
              {m.order != null && <span className="opacity-60">{m.order}. </span>}
              {m.topic} <span className="opacity-70">({m.count})</span>
            </Pill>
          ))}
          {!modulesLoading && modules.length === 0 && (
            <p className="text-sm text-fg-muted">No modules in the bank yet.</p>
          )}
          {/* Rendered after the map, not as part of it, so it stays last as
              modules are added. */}
          <Pill active={selection.kind === 'all'} onClick={() => setSelection({ kind: 'all' })} align="left">
            All modules
          </Pill>
        </div>
      </Fieldset>

      {paths.length > 0 && (
        <Fieldset legend="Or a whole learning path">
          <div className="grid grid-cols-1 gap-2">
            {paths.map((p) => (
              <Pill
                key={p.id}
                active={selection.kind === 'path' && selection.id === p.id}
                onClick={() => setSelection({ kind: 'path', id: p.id })}
                align="left"
              >
                {p.title}{' '}
                <span className="opacity-70">
                  ({p.moduleCount} module{p.moduleCount === 1 ? '' : 's'}, {p.count})
                </span>
              </Pill>
            ))}
          </div>
          {/* Modules sit in more than one path, so these counts overlap and
              sum to more than the bank. Say so rather than let it look wrong. */}
          <p className="mt-2 px-1 text-xs text-fg-muted">
            Paths share modules, so a question can appear under more than one.
          </p>
        </Fieldset>
      )}

      <Fieldset legend="Number of questions">
        <div className="flex gap-2">
          {COUNTS.map((n) => (
            <Pill key={n} active={count === n} onClick={() => setCount(n)}>
              {n}
            </Pill>
          ))}
        </div>
      </Fieldset>

      {poolSize !== null && (
        <p className="mt-4 text-xs text-fg-muted">
          {poolSize === 0
            ? `No MCQs available for ${selection.kind === 'all' ? 'this bank' : scope} yet.`
            : `${poolSize} MCQ${poolSize === 1 ? '' : 's'} available in ${scope}.`}
        </p>
      )}

      <button
        type="button"
        onClick={start}
        disabled={poolSize === 0}
        className="mt-4 w-full rounded-md bg-accent px-4 py-3 text-base font-semibold text-accent-fg disabled:opacity-50"
      >
        {willDeliver !== null && willDeliver < count
          ? `Start quiz (${willDeliver} questions)`
          : 'Start quiz'}
      </button>
    </section>
  );
}

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="mt-4 rounded-lg bg-bg-elevated p-4">
      <legend className="px-1 text-sm font-semibold text-fg-muted">{legend}</legend>
      <div className="mt-2">{children}</div>
    </fieldset>
  );
}

function Pill({
  active,
  onClick,
  children,
  align = 'center',
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  /** Module titles wrap to two lines, and centred wrapped text is hard to
   *  scan, so those pills align left. Short pills stay centred. */
  align?: 'center' | 'left';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'flex-1 rounded-md px-3 py-2 text-sm font-medium',
        align === 'left' ? 'text-left' : 'text-center',
        active ? 'bg-accent text-accent-fg' : 'bg-bg text-fg',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

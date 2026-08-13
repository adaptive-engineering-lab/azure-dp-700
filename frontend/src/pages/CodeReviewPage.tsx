import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModules } from '../lib/questions/useModules';
import { selectionParams } from '../lib/questions/selection';
import type { Selection } from '../lib/questions/selection';
import type { CodeReviewSubMode } from '../lib/questions/types';
import { ROUTES } from '../lib/routes';
import { supabase } from '../lib/supabase';

const SUB_MODES: { id: CodeReviewSubMode; label: string; description: string }[] = [
  {
    id: 'find-the-bug',
    label: 'Find the bug',
    description: 'Spot a deliberate flaw in a real-looking snippet.',
  },
  {
    id: 'what-does-this-do',
    label: 'What does this do?',
    description: 'Predict the behaviour of a correct snippet.',
  },
  {
    id: 'fill-the-blank',
    label: 'Fill the blank',
    description: 'Pick the value that completes the snippet correctly.',
  },
];

const COUNTS = [5, 10, 15] as const;

export default function CodeReviewPage() {
  const navigate = useNavigate();
  const [subMode, setSubMode] = useState<CodeReviewSubMode>('find-the-bug');
  const [count, setCount] = useState<5 | 10 | 15>(5);
  const { modules, paths, loading: modulesLoading } = useModules('code-review');
  const [selection, setSelection] = useState<Selection>({ kind: 'all' });
  const [poolSize, setPoolSize] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let query = supabase()
      .from('questions')
      .select('id, content', { count: 'exact' })
      .eq('type', 'code-review');
    if (selection.kind === 'module') query = query.eq('topic', selection.topic);
    if (selection.kind === 'path') query = query.contains('tags', [`path:${selection.id}`]);
    query.then(({ data, count: n }) => {
      if (cancelled) return;
      if (!data) {
        setPoolSize(n ?? 0);
        return;
      }
      const matching = data.filter(
        (row: { content: { sub_mode?: string } }) => row.content?.sub_mode === subMode,
      ).length;
      setPoolSize(matching);
    });
    return () => {
      cancelled = true;
    };
  }, [selection, subMode]);

  const willDeliver = poolSize === null ? null : Math.min(poolSize, count);

  function start() {
    const p = new URLSearchParams({
      sub_mode: subMode,
      count: String(count),
    });
    for (const [k, v] of selectionParams(selection)) p.set(k, v);
    navigate(`${ROUTES.codeReview}/session?${p.toString()}`);
  }

  return (
    <section className="mx-auto w-full max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Code Review</h1>
        <p className="mt-1 text-fg-muted">
          Python / YAML / Bash snippets from Azure ML, Foundry, and GitHub Actions.
        </p>
      </header>

      <Fieldset legend="Sub-mode">
        <div className="grid gap-2">
          {SUB_MODES.map((sm) => (
            <button
              key={sm.id}
              type="button"
              onClick={() => setSubMode(sm.id)}
              aria-pressed={subMode === sm.id}
              className={[
                'rounded-md px-3 py-3 text-left',
                subMode === sm.id ? 'bg-accent text-accent-fg' : 'bg-bg text-fg',
              ].join(' ')}
            >
              <div className="text-sm font-semibold">{sm.label}</div>
              <div
                className={[
                  'mt-0.5 text-xs',
                  subMode === sm.id ? 'text-accent-fg/80' : 'text-fg-muted',
                ].join(' ')}
              >
                {sm.description}
              </div>
            </button>
          ))}
        </div>
      </Fieldset>

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
            <p className="text-sm text-fg-muted">No code-review items in the bank yet.</p>
          )}
          {/* Rendered after the map, not as part of it, so it stays last as
              modules are added. */}
          <Pill active={selection.kind === 'all'} onClick={() => setSelection({ kind: 'all' })} align="left">
            Any module
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
          <p className="mt-2 px-1 text-xs text-fg-muted">
            Paths share modules, so an item can appear under more than one.
          </p>
        </Fieldset>
      )}

      <Fieldset legend="Number of items">
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
            ? `No items available for that combination yet.`
            : `${poolSize} item${poolSize === 1 ? '' : 's'} available.`}
        </p>
      )}

      <button
        type="button"
        onClick={start}
        disabled={poolSize === 0}
        className="mt-4 w-full rounded-md bg-accent px-4 py-3 text-base font-semibold text-accent-fg disabled:opacity-50"
      >
        {willDeliver !== null && willDeliver < count
          ? `Start (${willDeliver} item${willDeliver === 1 ? '' : 's'})`
          : 'Start'}
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

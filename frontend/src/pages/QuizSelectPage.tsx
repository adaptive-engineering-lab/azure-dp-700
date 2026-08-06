import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useModules } from '../lib/questions/useModules';
import { ROUTES } from '../lib/routes';
import { supabase } from '../lib/supabase';

const COUNTS = [5, 10, 20] as const;

export default function QuizSelectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { modules, loading: modulesLoading } = useModules('mcq');
  // 'all' mixes every module; otherwise the value is a module title (an
  // item's `topic`).
  const [topic, setTopic] = useState<string>(searchParams.get('topic') ?? 'all');
  const [count, setCount] = useState<5 | 10 | 20>(10);
  const [poolSize, setPoolSize] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let query = supabase().from('questions').select('id', { count: 'exact', head: true }).eq('type', 'mcq');
    if (topic !== 'all') query = query.eq('topic', topic);
    query.then(({ count: n }) => {
      if (!cancelled) setPoolSize(n ?? 0);
    });
    return () => {
      cancelled = true;
    };
  }, [topic]);

  const willDeliver = poolSize === null ? null : Math.min(poolSize, count);

  function start() {
    const p = new URLSearchParams({
      count: String(count),
    });
    if (topic !== 'all') p.set('topic', topic);
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
            <Pill key={m.topic} active={topic === m.topic} onClick={() => setTopic(m.topic)} align="left">
              {m.order != null && <span className="opacity-60">{m.order}. </span>}
              {m.topic} <span className="opacity-70">({m.count})</span>
            </Pill>
          ))}
          {!modulesLoading && modules.length === 0 && (
            <p className="text-sm text-fg-muted">No modules in the bank yet.</p>
          )}
          {/* Rendered after the map, not as part of it, so it stays last as
              modules are added. */}
          <Pill active={topic === 'all'} onClick={() => setTopic('all')} align="left">
            All modules
          </Pill>
        </div>
      </Fieldset>

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
            ? `No MCQs available for ${topic === 'all' ? 'this bank' : topic} yet.`
            : `${poolSize} MCQ${poolSize === 1 ? '' : 's'} available in ${topic === 'all' ? 'all modules' : topic}.`}
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

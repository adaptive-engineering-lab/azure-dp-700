import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import type { Domain, Question } from './types';

export interface ModuleOption {
  /** The Microsoft Learn module title — stored as the item's `topic`. */
  topic: string;
  domain: Domain;
  count: number;
}

/**
 * The modules that actually have items of a given type, with counts.
 *
 * Derived from the bank rather than from a fixed list, so a module appears in
 * the picker the moment its first question is seeded and disappears if the
 * last one is removed. Tallied client-side — Postgres `distinct` is not
 * expressible through PostgREST's REST surface, and the payload is two short
 * columns over a bank in the low hundreds.
 */
export function useModules(type: Question['type']) {
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase()
      .from('questions')
      .select('topic, domain')
      .eq('type', type)
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err.message);
          setModules([]);
        } else {
          const tally = new Map<string, ModuleOption>();
          for (const row of (data ?? []) as { topic: string; domain: Domain }[]) {
            const hit = tally.get(row.topic);
            if (hit) hit.count += 1;
            else tally.set(row.topic, { topic: row.topic, domain: row.domain, count: 1 });
          }
          setModules([...tally.values()].sort((a, b) => a.topic.localeCompare(b.topic)));
          setError(null);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  return { modules, loading, error };
}

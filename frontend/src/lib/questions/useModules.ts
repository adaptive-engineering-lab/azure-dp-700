import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { LEARNING_PATHS, learningPathIds } from './types';
import type { Domain, Question } from './types';

export interface ModuleOption {
  /** The Microsoft Learn module title — stored as the item's `topic`. */
  topic: string;
  domain: Domain;
  count: number;
  /**
   * Study order, from the leading number on the source markdown filename
   * (`3-DP-700_Apache-Spark_Quiz.md` → 3). Undefined when the file was not
   * numbered.
   */
  order?: number;
}

export interface LearningPathOption {
  id: string;
  title: string;
  /** Items of the requested type across every module in the path. */
  count: number;
  /**
   * Modules contributing to that count — the ones actually in the bank, not
   * the number Microsoft publishes for the path.
   */
  moduleCount: number;
}

/** Read `order:<n>` out of an item's tags. */
function readOrder(tags: string[] | null): number | undefined {
  const tag = tags?.find((t) => t.startsWith('order:'));
  if (!tag) return undefined;
  const n = Number(tag.slice('order:'.length));
  return Number.isFinite(n) ? n : undefined;
}

/**
 * The modules and learning paths that actually have items of a given type,
 * with counts.
 *
 * Derived from the bank rather than from a fixed list, so a module appears in
 * the picker the moment its first question is seeded and disappears if the
 * last one is removed. Tallied client-side — Postgres `distinct` is not
 * expressible through PostgREST's REST surface, and the payload is two short
 * columns over a bank in the low hundreds.
 *
 * A module belongs to several paths, so the path counts deliberately overlap:
 * they sum to more than the bank size, and one module's questions can be
 * reached from more than one path pill.
 */
export function useModules(type: Question['type']) {
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [paths, setPaths] = useState<LearningPathOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase()
      .from('questions')
      .select('topic, domain, tags')
      .eq('type', type)
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err.message);
          setModules([]);
          setPaths([]);
        } else {
          const tally = new Map<string, ModuleOption>();
          const byPath = new Map<string, { count: number; topics: Set<string> }>();
          for (const row of (data ?? []) as { topic: string; domain: Domain; tags: string[] | null }[]) {
            const hit = tally.get(row.topic);
            if (hit) {
              hit.count += 1;
            } else {
              tally.set(row.topic, {
                topic: row.topic,
                domain: row.domain,
                count: 1,
                order: readOrder(row.tags),
              });
            }
            for (const id of learningPathIds(row.tags ?? undefined)) {
              const seen = byPath.get(id) ?? { count: 0, topics: new Set<string>() };
              seen.count += 1;
              seen.topics.add(row.topic);
              byPath.set(id, seen);
            }
          }
          // Study order first; unnumbered modules fall to the end, alphabetical.
          setModules(
            [...tally.values()].sort(
              (a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.topic.localeCompare(b.topic),
            ),
          );
          // Walk LEARNING_PATHS rather than the tally so paths keep their
          // published order instead of the order questions happened to arrive.
          setPaths(
            Object.entries(LEARNING_PATHS).flatMap(([id, title]) => {
              const seen = byPath.get(id);
              return seen ? [{ id, title, count: seen.count, moduleCount: seen.topics.size }] : [];
            }),
          );
          setError(null);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  return { modules, paths, loading, error };
}

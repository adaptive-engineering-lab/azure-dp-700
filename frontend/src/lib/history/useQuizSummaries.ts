import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';
import { foldPendingIntoSummaries } from './merge';
import { fetchSummaries } from './query';
import { usePendingAttempts } from './usePendingAttempts';
import type { QuizAttemptSummary } from './types';

/**
 * Attempt count, best and latest score for each quiz the learner has taken,
 * keyed by `summaryKey`. Empty, without a request, when signed out.
 */
export function useQuizSummaries(userId: string | undefined) {
  const [rows, setRows] = useState<QuizAttemptSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const refetch = useCallback(() => setReload((n) => n + 1), []);
  const pending = usePendingAttempts(userId, refetch);

  useEffect(() => {
    if (!userId) {
      setRows([]);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchSummaries(supabase(), userId)
      .then((data) => {
        if (cancelled) return;
        setRows(data);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load quiz counts.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, reload]);

  const summaries = useMemo(() => foldPendingIntoSummaries(rows, pending), [rows, pending]);
  return { summaries, loading, error };
}

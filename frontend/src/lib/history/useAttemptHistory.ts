import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';
import { mergePendingAttempts } from './merge';
import { fetchAttemptPage } from './query';
import { usePendingAttempts } from './usePendingAttempts';
import type { HistoryFilters, QuizAttempt } from './types';

interface State {
  rows: QuizAttempt[];
  hasMore: boolean;
  cursor: string | null;
  loading: boolean;
  error: string | null;
}

const INITIAL: State = { rows: [], hasMore: false, cursor: null, loading: false, error: null };

/** The signed-in learner's attempts, from the server, with pending ones laid over. */
export function useAttemptHistory(userId: string | undefined, filters: HistoryFilters) {
  const [state, setState] = useState<State>(INITIAL);
  const [reload, setReload] = useState(0);
  const refetch = useCallback(() => setReload((n) => n + 1), []);
  const pending = usePendingAttempts(userId, refetch);

  // The view switch is not a filter; only these change what the server returns.
  const { quiz, range, result } = filters;
  const queryFilters = useMemo<HistoryFilters>(
    () => ({ view: 'list', quiz, range, result }),
    [quiz, range, result],
  );

  useEffect(() => {
    if (!userId) {
      setState(INITIAL);
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchAttemptPage(supabase(), userId, queryFilters, null)
      .then((page) => {
        if (cancelled) return;
        setState({
          rows: page.rows,
          hasMore: page.hasMore,
          cursor: page.nextCursor,
          loading: false,
          error: null,
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setState({ ...INITIAL, error: e instanceof Error ? e.message : 'Could not load history.' });
      });
    return () => {
      cancelled = true;
    };
  }, [userId, queryFilters, reload]);

  const loadMore = useCallback(() => {
    if (!userId || !state.cursor || state.loading) return;
    const cursor = state.cursor;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchAttemptPage(supabase(), userId, queryFilters, cursor)
      .then((page) => {
        setState((s) => {
          // Ignore a page that arrives after the filters changed underneath it.
          if (s.cursor !== cursor) return s;
          const seen = new Set(s.rows.map((r) => r.id));
          return {
            rows: [...s.rows, ...page.rows.filter((r) => !seen.has(r.id))],
            hasMore: page.hasMore,
            cursor: page.nextCursor,
            loading: false,
            error: null,
          };
        });
      })
      .catch((e: unknown) => {
        setState((s) => ({
          ...s,
          loading: false,
          error: e instanceof Error ? e.message : 'Could not load more.',
        }));
      });
  }, [userId, queryFilters, state.cursor, state.loading]);

  const attempts = useMemo(
    () => mergePendingAttempts(state.rows, pending, queryFilters, { hasMore: state.hasMore }),
    [state.rows, state.hasMore, pending, queryFilters],
  );

  return {
    attempts,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    loadMore,
    retry: refetch,
  };
}

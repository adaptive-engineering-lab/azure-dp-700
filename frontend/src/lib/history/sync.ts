import { useEffect } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { useAppStore, type GuestSession } from '../store';

/** Wait before each retry after a failed push; the last delay repeats. */
export const RETRY_DELAYS_MS = [5_000, 30_000, 120_000] as const;

/**
 * Write sessions to the account. Idempotent: the id is the client's, and a
 * row that already exists is skipped (ON CONFLICT DO NOTHING), so a retry, a
 * second tab, or the app-load migration racing this write all leave one row.
 */
export async function pushSessions(
  client: SupabaseClient,
  userId: string,
  sessions: GuestSession[],
): Promise<void> {
  if (sessions.length === 0) return;
  const rows = sessions.map((s) => ({
    id: s.id,
    user_id: userId,
    mode: s.mode,
    topic: s.topic,
    score_pct: s.scorePct,
    question_count: s.questionCount ?? null,
    correct_count: s.correctCount ?? null,
    duration_seconds: s.durationSeconds,
    completed_at: s.completedAt,
  }));
  const { error } = await client
    .from('sessions')
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw new Error(`push sessions failed: ${error.message}`);
}

function pendingFor(sessions: GuestSession[], userId: string): GuestSession[] {
  return sessions.filter((s) => s.pendingSync && s.ownerId === userId);
}

/**
 * Push this user's pending sessions now, whenever a new one is recorded, when
 * the browser comes back online, and on a backoff after a failure. Pending
 * sessions live in the persisted store, so a reload picks up where this left
 * off. Returns a function that stops all of it.
 */
export function startAttemptSync(
  userId: string,
  getClient: () => SupabaseClient = supabase,
): () => void {
  let stopped = false;
  let inFlight = false;
  let again = false;
  let failures = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clearTimer = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  const scheduleRetry = () => {
    clearTimer();
    const delay = RETRY_DELAYS_MS[Math.min(failures, RETRY_DELAYS_MS.length - 1)];
    failures += 1;
    timer = setTimeout(() => void flush(), delay);
  };

  async function flush(): Promise<void> {
    if (stopped) return;
    if (inFlight) {
      again = true;
      return;
    }
    const pending = pendingFor(useAppStore.getState().sessions, userId);
    if (pending.length === 0) return;

    inFlight = true;
    clearTimer();
    try {
      await pushSessions(getClient(), userId, pending);
      useAppStore.getState().markSessionsSynced(pending.map((s) => s.id));
      failures = 0;
    } catch {
      if (!stopped) scheduleRetry();
    } finally {
      inFlight = false;
    }
    if (again && !stopped) {
      again = false;
      await flush();
    }
  }

  const unsubscribe = useAppStore.subscribe((state, prev) => {
    if (state.sessions === prev.sessions) return;
    const before = new Set(pendingFor(prev.sessions, userId).map((s) => s.id));
    if (pendingFor(state.sessions, userId).some((s) => !before.has(s.id))) void flush();
  });

  const onOnline = () => {
    failures = 0;
    void flush();
  };
  window.addEventListener('online', onOnline);

  void flush();

  return () => {
    stopped = true;
    clearTimer();
    unsubscribe();
    window.removeEventListener('online', onOnline);
  };
}

/** Keep the signed-in user's finished quizzes flowing to their account. */
export function useAttemptSync(userId: string | undefined): void {
  useEffect(() => {
    if (!userId) return;
    return startAttemptSync(userId);
  }, [userId]);
}

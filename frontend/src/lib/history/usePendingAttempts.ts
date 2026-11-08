import { useEffect, useMemo, useRef } from 'react';
import { useAppStore } from '../store';
import { sessionToAttempt } from './merge';
import type { QuizAttempt } from './types';

/**
 * This user's MCQ attempts that are on the device but not yet confirmed by the
 * server. Calls `onSynced` whenever one of them stops being pending, so the
 * caller can re-read the server copy.
 */
export function usePendingAttempts(
  userId: string | undefined,
  onSynced: () => void,
): QuizAttempt[] {
  const sessions = useAppStore((s) => s.sessions);
  const pending = useMemo(
    () =>
      userId
        ? sessions
            .filter((s) => s.mode === 'mcq' && s.pendingSync && s.ownerId === userId)
            .map(sessionToAttempt)
        : [],
    [sessions, userId],
  );

  const previous = useRef<Set<string>>(new Set());
  const onSyncedRef = useRef(onSynced);
  onSyncedRef.current = onSynced;
  useEffect(() => {
    const now = new Set(pending.map((p) => p.id));
    const cleared = [...previous.current].some((id) => !now.has(id));
    previous.current = now;
    if (cleared) onSyncedRef.current();
  }, [pending]);

  return pending;
}

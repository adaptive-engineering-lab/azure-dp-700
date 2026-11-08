import type { GuestProgress, GuestSession } from '../store';

export interface MigrationPlan {
  progressCount: number;
  sessionCount: number;
  progress: GuestProgress[];
  sessions: GuestSession[];
}

export function buildMigrationPlan(input: {
  progress: Record<string, GuestProgress>;
  sessions: GuestSession[];
  /** The account being migrated into. */
  userId?: string;
}): MigrationPlan {
  const progress = Object.values(input.progress);
  // On a shared device the local list can still hold another account's
  // sessions. Guest sessions (no owner) migrate; someone else's never do.
  const sessions = input.sessions.filter((s) => !s.ownerId || s.ownerId === input.userId);
  return {
    progressCount: progress.length,
    sessionCount: sessions.length,
    progress,
    sessions,
  };
}

export function migrationIsEmpty(plan: MigrationPlan): boolean {
  return plan.progressCount === 0 && plan.sessionCount === 0;
}

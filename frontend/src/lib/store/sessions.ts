export type SessionMode = 'mcq' | 'code-review' | 'daily-review';

export interface GuestSession {
  id: string;
  mode: SessionMode;
  topic: string | null;
  scorePct: number | null;
  durationSeconds: number | null;
  completedAt: string; // ISO timestamp
  questionCount?: number | null; // questions in the attempt; absent on older sessions
  correctCount?: number | null; // answered correctly; absent on older sessions
  ownerId?: string | null; // account it belongs to; absent for guest sessions
  pendingSync?: boolean; // true until the server confirms the write
}

export const SESSIONS_CAP = 500;

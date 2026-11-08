# Contract: Store Actions & Sync

## Store (`frontend/src/lib/store/index.ts`)

### `recordSession` (extended)

```ts
recordSession(input: {
  mode: SessionMode;
  topic: string | null;
  scorePct: number | null;
  durationSeconds: number | null;
  questionCount?: number | null;   // new
  correctCount?: number | null;    // new
  ownerId?: string | null;         // new: signed-in user id, or null for a guest
  now?: Date;
}): GuestSession                    // now returns the created session
```

- When `ownerId` is set, the session is stored with `ownerId` and `pendingSync: true`.
- It stays synchronous with no I/O, so the results screen is never delayed (FR-005).
- `QuizSessionPage` passes `questionCount: questions.length`, `correctCount` and `ownerId: user?.id ?? null`. Other modes don't change.

### `markSessionsSynced(ids: string[])` (new)

Sets `pendingSync: false` on the matching sessions. Unknown ids are a no-op.

### `hydrateFromServer` (changed)

Server sessions are mapped with `ownerId: userId` and `pendingSync: false`, plus the counts. Local sessions with `pendingSync === true` whose id isn't in the server set are **kept**. The merged list is sorted by `completedAt` descending and capped at `SESSIONS_CAP`; pending rows are never the ones dropped. `hydrate.ts` also selects `question_count, correct_count` and passes `userId`.

## Migration (`frontend/src/lib/migration/`)

- `buildMigrationPlan({ progress, sessions, userId })` leaves out sessions where `ownerId` is set and isn't `userId`.
- `executeMigration` writes sessions with C1 (`upsert … ignoreDuplicates`) instead of `insert`, and includes `question_count` and `correct_count`. The `sessionsInserted` semantics don't change.
- `MigrationPrompt` passes `user.id` to `buildMigrationPlan`.

## Sync hook (`frontend/src/lib/history/sync.ts`)

```ts
export async function pushSessions(client, userId, sessions: GuestSession[]): Promise<void>;  // C1; throws on error
export function useAttemptSync(userId: string | undefined): void;
```

`useAttemptSync` is mounted inside `AuthProvider` with `session?.user?.id`:

| Trigger | Action |
| --- | --- |
| `userId` becomes defined | flush |
| store change adds a pending id for `userId` | flush |
| `window` `online` | flush |
| flush fails | schedule a retry at 5 s, 30 s, then 120 s (the last repeats); reset after success |
| `userId` becomes undefined or unmounts | clear timers and listeners |

A flush selects `sessions.filter(s => s.pendingSync && s.ownerId === userId)`, sends them in one upsert, and on success calls `markSessionsSynced`. A module-level `inFlight` flag skips a flush while one is already running.

## Read hooks (`frontend/src/lib/history/`)

```ts
useAttemptHistory(userId, filters) → { attempts: QuizAttempt[]; loading; error; hasMore; loadMore(); retry() }
useQuizSummaries(userId)           → { summaries: Map<string, QuizAttemptSummary>; loading; error }   // key = summaryKey(topic)
```

Both re-read the pending sessions from the store, so a just-finished attempt shows up immediately (FR-021). Both refetch when a pending id is cleared, which picks up the server copy.

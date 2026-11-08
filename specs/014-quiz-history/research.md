# Research: Quiz History & Attempt Counts

**Feature**: 014-quiz-history | **Date**: 2026-11-07

Each section records a decision, why it was made, and what was rejected. Line references are to the code as of `main` @ `3c873fd`.

## What exists today

| Concern | Where | Behavior |
| --- | --- | --- |
| Finishing a quiz | `frontend/src/pages/QuizSessionPage.tsx` `nextQuestion()` | Calls `recordSession({ mode: 'mcq', topic, scorePct, durationSeconds })`. `topic` is the module title, or `null` for the mixed quiz. Leaving mid-quiz records nothing (already meets FR-004). |
| Local session record | `frontend/src/lib/store/index.ts` `recordSession` | Prepends a `GuestSession` with a client `crypto.randomUUID()` id to `sessions[]`, capped at `SESSIONS_CAP = 500`. Persisted to localStorage (`dp700game.v1.state`). |
| Server push of sessions | `frontend/src/components/MigrationPrompt.tsx`, mounted in `AppShell` | Runs **once per AppShell mount** for a signed-in user. It calls `executeMigration` (selects existing ids, inserts the rest) and then `hydrateStoreFromServer`. There's no push when a quiz finishes. |
| Hydrate | `frontend/src/lib/migration/hydrate.ts` → store `hydrateFromServer` | **Replaces** local `sessions[]` with the newest 500 server rows. |
| Profile push | `frontend/src/lib/auth/AuthProvider.tsx` | Debounced store subscription pushes `profile` while signed in. This is the pattern to copy. |
| Table + RLS | `0006_sessions.sql`, `0007_user_tables_rls.sql`, `0018`/`0019` grants | Owner-only select/insert/update/delete. `anon` may select but always gets zero rows. Rows are deleted by cascade when the account is deleted (`0013`). |
| Picker | `frontend/src/pages/QuizSelectPage.tsx` + `lib/questions/useModules.ts` | Modules are keyed by `topic` string. "All modules" is a separate pill. |
| Nav | `frontend/src/components/AppShell.tsx` `NAV` | 4-column bottom bar. |
| Postgres | `supabase/config.toml` | `major_version = 17`, so `security_invoker` views are available. |

## Problems found

### 1. Hydrate can drop an attempt that hasn't synced

`hydrateFromServer` overwrites `sessions[]`. Today that's safe only because `executeMigration` pushes first, and hydrate is skipped if the push throws. Once attempts are pushed independently, an attempt that fails to push and then a successful hydrate (for example, on another tab's mount) would erase the only copy.

**Decision**: hydrate merges in local sessions still flagged `pendingSync` (by id) instead of overwriting them.

### 2. Two writers race on the same id

`executeMigration` does a select-then-insert. If the new completion-time push lands between the select and the insert, the insert hits a primary-key conflict and `MigrationPrompt` shows an error banner.

**Decision**: both writers use `upsert(rows, { onConflict: 'id', ignoreDuplicates: true })`, which is `INSERT … ON CONFLICT (id) DO NOTHING`. The pre-select stays only to compute `sessionsInserted` for the existing result shape and tests.

**Rationale**: this makes the write idempotent at the database, which is what FR-007 and SC-003 need. It doesn't depend on the client coordinating between tabs. `ON CONFLICT DO NOTHING` needs only the INSERT privilege and the insert policy, both granted in `0018` and `0007`.

**Alternatives rejected**:
- Merge-on-update upsert: needs the UPDATE policy and could overwrite a row.
- A cross-tab lock through BroadcastChannel or Web Locks: adds machinery the database constraint already gives for free.

### 3. A shared device can migrate one user's sessions into another's account

`sessions[]` isn't cleared on sign-out and carries no owner. If user B signs in where A was, `MigrationPrompt` tries to insert A's hydrated session ids under B. Today that fails with a PK conflict and shows an error banner. With `ignoreDuplicates` it would silently skip rows that are already on the server, but A's *pending* (never-synced) attempts would be inserted under B.

**Decision**: tag sessions with `ownerId`. That's the user id for attempts recorded while signed in and for hydrated rows; it's absent for guest or legacy rows. `buildMigrationPlan` takes the signed-in user's id and leaves out sessions whose `ownerId` is set to someone else. The pending flush pushes only `ownerId === userId`. Legacy rows with no owner keep today's behavior.

**Out of scope**: clearing local data on sign-out (it changes guest behavior). This feature stays safe without it, because History and badges are signed-in only and filter by owner.

## Decisions

### D1. Where attempts live: extend `sessions`, not a new table

Add nullable `question_count` and `correct_count` to `public.sessions`, plus a check constraint. Quiz identity stays `topic`: the module title, or `NULL` for "All modules".

- **Rationale**: an attempt *is* an MCQ session. The RLS, grants, cascade delete, migration and hydrate paths all exist already. Older rows keep `NULL` counts, which the UI shows as "—" (FR-012).
- **Rejected**: a separate `quiz_attempts` table. It would duplicate every policy, grant, cascade and sync path and split the data that `/progress` reads.

### D2. Pass/fail is derived, not stored

`PASS_MARK_PCT = 70` is a frontend constant, and the server filters on `score_pct >= 70` or `< 70`. A row with `score_pct IS NULL` has no badge and matches neither Passed nor Failed.

- **Rationale**: the spec says to derive it. Storing it would freeze today's threshold into historical rows.

### D3. Saving at completion: pending flag + background flush

- `recordSession` gains `questionCount`, `correctCount` and `ownerId`. When `ownerId` is set, the session is stored with `pendingSync: true`. The local write is synchronous, so the results screen never waits (FR-005).
- A new `useAttemptSync(userId)` hook, mounted in `AuthProvider` next to the profile push, flushes `sessions.filter(s => s.pendingSync && s.ownerId === userId)` through D2's idempotent upsert. On success it calls `markSessionsSynced(ids)`.
- **Triggers**: user becomes available, store change that adds a pending id, `window` `online` event, and a retry timer with backoff of 5 s, 30 s, then 120 s repeating. An in-flight guard prevents overlapping flushes in one tab. Multiple tabs are safe because the write is idempotent.
- **Persistence**: the flag lives in the persisted store, so retries survive reloads (FR-006). A reload also re-runs `MigrationPrompt`, which pushes the row anyway.
- **Rejected**:
  - A service-worker Background Sync queue: needs a custom SW handler and auth token handling, and Safari doesn't support it.
  - Awaiting the write on the results screen: breaks FR-005 and fails offline.

### D4. Reading History: from the server, with local pending merged in

- **Attempt list**: `sessions` filtered to `mode = 'mcq'` plus the optional filters. Ordered `completed_at desc, id desc`, with keyset pagination on `(completed_at, id)`, so that attempts with the same finish time are neither skipped nor repeated at a page break. Each page fetches 51 rows to learn whether a next page exists and shows 50. Local pending attempts are merged by id. The ones that pass the active filters are inserted in order and marked "Not yet synced" (FR-016).
  - **Rationale**: reading from the server is what makes a second device current without a reload (SC-001). Reading only the store is capped at 500 and only as fresh as the last app load.
  - **Rejected**: offset pagination with `.range()`. Rows added while scrolling would shift pages and cause duplicates.
- **Summaries (By quiz + picker badges)**: a new view, `public.quiz_attempt_summaries`, created `with (security_invoker = on)` so the base table's RLS applies to the caller. It returns one row per `(user_id, topic)` with `attempt_count`, `best_score_pct`, `latest_score_pct` and `last_taken_at`. Local pending attempts are folded in client-side.
  - **Rationale**: aggregating in Postgres avoids pulling every row. Supabase caps responses at 1,000 rows by default, which would silently undercount heavy users.
  - **Rejected**: a `SECURITY DEFINER` RPC (bypasses RLS, so it needs its own `auth.uid()` guard), and computing counts from a full client-side fetch (hits the 1,000-row cap).
  - **Known gap**: if a push succeeds but its response is lost, the attempt stays flagged pending until the next flush, about 5 s later. For that window the summary counts it twice. That's acceptable. The list can't double-count because it dedupes by id.

### D5. Indexes

No new index. `sessions_user_completed_idx (user_id, completed_at desc)` serves the list query, and the `mode`, `topic` and `score_pct` predicates filter within one user's rows. The view groups one user's rows. At the spec's scale of 1,000 attempts per learner, that's well within SC-004.

### D6. Routing and URL contract

- The page lives at `ROUTES.history = '/history'`, is lazy-loaded like the other pages, and is added as a fifth bottom-nav item. At 375 px, five equal columns are 75 px each, which fits "History".
- Filters and view are query parameters (see `contracts/history-route.md`). Defaults are left out of the URL so plain `/history` stays canonical.
- **Rejected**: nesting under `/progress/history`. The spec names `/history`, and nested routes would light up "Progress" as the active tab.

### D7. "Last 7 / 30 days"

The range starts at local midnight on `today − (N − 1)` and is converted to an ISO instant for a `completed_at >= since` filter. This matches the spec's "today plus the previous 6 calendar days" and stays correct across DST changes because it's computed from local date parts.

### D8. Local schema version

New `GuestSession` fields are optional. Old persisted state reads as `undefined`, which means not pending, no owner and no counts. `SCHEMA_VERSION` stays at 1 and no migrator is needed.

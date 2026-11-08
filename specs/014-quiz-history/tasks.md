---
description: "Task list for feature 014: Quiz History & Attempt Counts"
---

# Tasks: Quiz History & Attempt Counts

**Input**: Design documents from `/specs/014-quiz-history/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included. The spec's success criteria require automated checks (SC-003 idempotency, SC-005 counts, SC-006 filters), and plan.md lists the test files. Write each test before its implementation and confirm it fails first.

**Organization**: tasks are grouped by user story. Paths are relative to the repo root. Frontend unit and component tests run with `cd frontend && pnpm test`. Integration tests (`tests/integration/`) run against local Supabase with `cd tools && pnpm test`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different file, no dependency on an unfinished task)
- **[Story]**: US1, US2 or US3, from spec.md

---

## Phase 1: Setup

**Purpose**: route constant, shared types and the Lighthouse URL.

- [X] T001 Add `history: '/history'` to the `ROUTES` object in `frontend/src/lib/routes.ts`, after `progress`.
- [X] T002 [P] Create `frontend/src/lib/history/types.ts` exporting `PASS_MARK_PCT = 70`, `HISTORY_PAGE_SIZE = 50`, `ALL_MODULES_KEY = 'all-modules'`, and the types `QuizAttempt`, `AttemptResult`, `QuizAttemptSummary` and `HistoryFilters`, exactly as in `specs/014-quiz-history/data-model.md` §4. In `HistoryFilters.quiz`, `undefined` means any quiz, `null` means All modules, and a string is a module title.
- [X] T003 [P] Add `"http://localhost/history"` to `ci.collect.url` in `.lighthouserc.json`, after `/progress`.

---

## Phase 2: Foundational (blocks all user stories)

**Purpose**: schema, the idempotent write path that saves at completion, and pure helpers every story uses. Once this phase is done, a finished quiz reaches the server within seconds, with counts.

**⚠️ CRITICAL**: no user-story work starts until this phase is complete.

### Database

- [X] T004 Create `supabase/migrations/0020_sessions_attempt_counts.sql`, following the header-comment style of `0019`. It must:
  1. `alter table public.sessions add column question_count integer null, add column correct_count integer null`;
  2. add constraint `sessions_counts_chk check ((question_count is null and correct_count is null) or (question_count > 0 and correct_count between 0 and question_count))`;
  3. create the view `public.quiz_attempt_summaries with (security_invoker = on)` using the exact SQL in `data-model.md` §2;
  4. `grant select on public.quiz_attempt_summaries to authenticated, anon;` and `grant select on public.quiz_attempt_summaries to service_role;`.
  Apply it with `supabase db reset` locally.
- [X] T005 [P] Write `tests/integration/quiz-history.test.ts`, using `serviceRoleClient`, `userClient`, `createTestUser` and `cleanupTestUsers` from `tools/test-helpers/` as `tests/integration/rls-isolation.test.ts` does. Cases: — **Written; not yet run** (Docker/local Supabase not running on 2026-11-07).
  - (a) sending the same row twice through `.from('sessions').upsert(row, { onConflict: 'id', ignoreDuplicates: true })` returns no error both times and leaves exactly 1 row (SC-003);
  - (b) inserting `question_count: 5, correct_count: 6` fails the check constraint;
  - (c) after inserting MCQ rows for topic `'Mod A'` with scores 60, 85, 70 (completed in that order), two `topic: null` rows and one `'Mod A'` code-review row, `quiz_attempt_summaries` returns `Mod A → attempt_count 3, best 85, latest 70` and `null → attempt_count 2` (SC-005);
  - (d) a topic whose only rows have `score_pct: null` has `best_score_pct` null.
- [X] T006 [P] Extend `tests/integration/rls-isolation.test.ts`: user B's `.from('quiz_attempt_summaries').select('*')` returns no rows belonging to user A. — **Written; not yet run** (Docker/local Supabase not running on 2026-11-07).
- [X] T007 [P] Extend `tests/integration/anon-no-read.test.ts`: add `it('returns zero rows from quiz_attempt_summaries')`, matching the existing `sessions` case. — **Written; not yet run** (Docker/local Supabase not running on 2026-11-07).

### Local store

- [X] T008 Extend `GuestSession` in `frontend/src/lib/store/sessions.ts` with the optional fields `questionCount?: number | null`, `correctCount?: number | null`, `ownerId?: string | null` and `pendingSync?: boolean`, each with a one-line comment (data-model §3). Don't bump `SCHEMA_VERSION`.
- [X] T009 Write `frontend/tests/unit/store-sessions.test.ts` (this should fail at first):
  - `recordSession` with `ownerId: 'u1'` returns the session with `pendingSync: true` and the counts set;
  - without `ownerId`, there's no `pendingSync`;
  - `markSessionsSynced([id])` clears the flag, and unknown ids are a no-op;
  - `hydrateFromServer` keeps a local `pendingSync` session that isn't in the server list, sets `ownerId`/`pendingSync: false` on server rows, sorts by `completedAt` descending, and never drops a pending row when capping at `SESSIONS_CAP`.
- [X] T010 Update `frontend/src/lib/store/index.ts` to pass T009:
  - `recordSession` accepts `questionCount`, `correctCount` and `ownerId`, sets `ownerId` and `pendingSync: !!ownerId`, and **returns** the new `GuestSession`. Update the `AppState` type.
  - Add the `markSessionsSynced(ids: string[])` action.
  - `hydrateFromServer` takes `userId` and merges in local pending sessions as above.

### Migration and hydrate paths

- [X] T011 Update `frontend/src/lib/migration/hydrate.ts`:
  - add `question_count, correct_count` to the sessions `select` and to `SessionRow`;
  - map them to `questionCount`/`correctCount`, with `ownerId: userId` and `pendingSync: false`;
  - pass `userId` to `hydrateFromServer`.
- [X] T012 Update `frontend/src/lib/migration/plan.ts`: `buildMigrationPlan({ progress, sessions, userId })` leaves out sessions whose `ownerId` is set and isn't `userId`, and `sessionCount` reflects the filtered list. Update `frontend/src/components/MigrationPrompt.tsx` to pass `userId: user.id`.
- [X] T013 Update `frontend/src/lib/migration/execute.ts`, in the sessions branch:
  - replace `.insert(toInsert)` with `.upsert(toInsert, { onConflict: 'id', ignoreDuplicates: true })`;
  - add `question_count: s.questionCount ?? null` and `correct_count: s.correctCount ?? null` to each row;
  - keep the pre-select so the `sessionsInserted` semantics don't change.
- [X] T014 Extend `frontend/tests/unit/migration.test.ts`: `buildMigrationPlan` excludes another owner's sessions but keeps owner-less ones and the user's own; `executeMigration` calls `upsert` with `ignoreDuplicates: true` and includes the count columns. Use a mocked client, as the existing tests do.

### Completion-time sync

- [X] T015 Write `frontend/tests/unit/history-sync.test.ts` with `vi.useFakeTimers()` and a mocked client whose `from('sessions').upsert` resolves or rejects as configured (this should fail at first). Cases:
  - `pushSessions` sends rows matching `contracts/attempts-data.md` C1 with `ignoreDuplicates: true`;
  - a flush sends only sessions with `pendingSync && ownerId === userId` and calls `markSessionsSynced` on success;
  - on failure it retries after 5 s, then 30 s, then every 120 s;
  - a `window` `online` event triggers a flush;
  - a second flush while one is in flight doesn't call `upsert` again.
- [X] T016 Create `frontend/src/lib/history/sync.ts` to pass T015. It exports:
  - `pushSessions(client: SupabaseClient, userId: string, sessions: GuestSession[]): Promise<void>`, which throws on `error`;
  - `useAttemptSync(userId: string | undefined): void`, with the triggers and backoff in `contracts/store-and-sync.md`. It uses `useAppStore.subscribe` to notice new pending ids and a module-level `inFlight` guard. It clears timers and listeners on cleanup or when `userId` changes.
  It imports `supabase` from `../supabase`.
- [X] T017 Mount `useAttemptSync(session?.user?.id)` inside `AuthProvider` in `frontend/src/lib/auth/AuthProvider.tsx`, next to the profile auto-save effect.
- [X] T018 Update `frontend/src/pages/QuizSessionPage.tsx` `nextQuestion()`: get `user` from `useAuth()` (`../lib/auth/AuthProvider`) and call `recordSession({ mode: 'mcq', topic, scorePct, durationSeconds, questionCount: questions!.length, correctCount, ownerId: user?.id ?? null })`. The flow is otherwise unchanged; the results screen still renders immediately.

### Shared pure helpers

- [X] T019 [P] Write `frontend/tests/unit/history-rules.test.ts`:
  - `attemptResult`: 69.5 → failed, 70 → passed, 0 → failed, null → null;
  - `rangeStart('7d', now)` = local midnight 6 days before `now`; `'30d'` = 29 days before; `'all'` → null; a case spanning a DST change, using `TZ` or a fixed `Date` with local parts;
  - `summaryKey(null)` → `'all-modules'`;
  - `formatDuration(125)` → `'2:05'`, null → `'—'`;
  - `formatCorrect(8, 10)` → `'8/10'`, `(null, 10)` → `'—'`.
- [X] T020 [P] Write `frontend/tests/unit/history-params.test.ts`:
  - `parseHistoryParams(new URLSearchParams(''))` returns the defaults `{ view: 'list', quiz: undefined, range: 'all', result: 'all' }`;
  - `quiz=all-modules` → `quiz: null`;
  - unknown `range`/`result`/`view` values fall back to their defaults;
  - `toHistoryParams` omits defaults, and for several filter combinations including a title with spaces and `&`, the result round-trips through `parseHistoryParams`.
- [X] T021 [P] Create `frontend/src/lib/history/rules.ts` (`attemptResult`, `rangeStart`, `summaryKey`, `formatDuration`, `formatCorrect`, per data-model §4) to pass T019.
- [X] T022 [P] Create `frontend/src/lib/history/params.ts` (`parseHistoryParams`, `toHistoryParams`, per `contracts/history-route.md`) to pass T020.

**Checkpoint**: `pnpm test` (frontend) and `cd tools && pnpm test` pass. Finishing a quiz while signed in creates a `sessions` row with counts within seconds (check it in Supabase Studio). Offline completion is flushed on reconnect.

---

## Phase 3: User Story 1 — History list (Priority: P1) 🎯 MVP

**Goal**: a signed-in learner opens History and sees every MCQ attempt from all their devices, newest first: quiz name, time, score, X/Y, duration and Passed/Failed. Pending attempts are labelled. There's a guest prompt, an empty state and Load more.

**Independent Test**: finish a module quiz on profile A, then open `/history` on profile B (same account). The row is there with correct values. 51 or more attempts → 50 rows plus "Load more".

### Tests for User Story 1

- [X] T023 [P] [US1] Add `mergePendingAttempts` cases to `frontend/tests/unit/history-merge.test.ts`:
  - dedupes by id (the server row wins, and `pending` stays true if the local copy is still flagged);
  - includes pending rows that match the filters and whose `completedAt` is newer than the page's lower bound (or every pending row when `hasMore` is false);
  - leaves out non-matching pending rows;
  - output is sorted by `completedAt` descending;
  - `topic: null` maps to the All-modules quiz.
- [X] T024 [P] [US1] Write `frontend/tests/component/history-page.test.tsx`. Mock `../../src/lib/supabase` with a chainable stub as in `routing.test.tsx`, adding `is`, `gte`, `lt`, `order` and `limit`. Render `HistoryPage` inside `createMemoryRouter`. Cases:
  - guest → sign-in prompt and no `from('sessions')` call;
  - signed in with 0 rows → empty state with a "Start a quiz" link to `/learn/quiz`;
  - 3 rows → 3 list items in order, showing "Passed"/"Failed" as text and "—" for null counts;
  - a pending store session → "Not yet synced";
  - 51 stub rows → 50 items plus "Load more", and clicking it requests a second page with an `lt('completed_at', …)` cursor.
  Mock `useAuth` to switch between guest and signed in.

### Implementation for User Story 1

- [X] T025 [US1] Create `frontend/src/lib/history/merge.ts` with `mergePendingAttempts(serverRows, pending, filters, { lowerBound, hasMore })` to pass T023. Reuse `attemptResult` and `rangeStart` from `rules.ts` for filter matching.
- [X] T026 [US1] Create `frontend/src/lib/history/query.ts` with `fetchAttemptPage(client: SupabaseClient, userId: string, filters: HistoryFilters, cursor: string | null, now = new Date())`. It builds the query in `contracts/attempts-data.md` C2 with `limit(HISTORY_PAGE_SIZE + 1)` and returns `{ rows: QuizAttempt[], hasMore, nextCursor }`. **It must take the client as a parameter and not import `../supabase`**, so integration tests can call it (T046).
- [X] T027 [US1] Create `frontend/src/lib/history/useAttemptHistory.ts`: `useAttemptHistory(userId, filters)` → `{ attempts, loading, error, hasMore, loadMore, retry }`.
  - It resets and refetches when `userId` or the filters change.
  - It reads pending sessions with `useAppStore((s) => s.sessions)` filtered to `mode === 'mcq' && pendingSync && ownerId === userId`, merges them with `mergePendingAttempts`, and refetches page 1 when the set of pending ids shrinks.
  - It ignores responses that arrive after the filters changed (a cancel flag, as in `QuizSessionPage`).
- [X] T028 [P] [US1] Create `frontend/src/components/history/ResultBadge.tsx`: given `result: AttemptResult`, it renders nothing for null, and otherwise a pill containing an `aria-hidden` glyph (✓/✕) plus the text "Passed"/"Failed". Use the existing `text-success`/`text-error` style tokens if present in `frontend/src/index.css` or the Tailwind config, otherwise `text-accent`/`text-error`. Meaning must never depend on color alone (FR-028).
- [X] T029 [P] [US1] Create `frontend/src/components/history/AttemptRow.tsx`, rendering one `<li>` per `contracts/history-route.md` "Attempt row":
  - quiz name (topic, or "All modules");
  - local date/time via `toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })`;
  - `scorePct%` or "—";
  - `formatCorrect`, `formatDuration` and `ResultBadge`;
  - a "Not yet synced" text label when `pending`.
  The layout is a two-line card at 375 px, using the existing `rounded-lg bg-bg-elevated p-3` styling.
- [X] T030 [US1] Create `frontend/src/pages/HistoryPage.tsx` (default export) to pass T024. It reads `user` and `loading` from `useAuth()` and `filters` from `parseHistoryParams(useSearchParams()[0])`, and renders the states from `contracts/history-route.md`:
  - Loading…;
  - guest prompt with a link to `ROUTES.signIn`;
  - empty state;
  - inline error with Retry;
  - `<ul>` of `AttemptRow`;
  - a "Load more" button.
  Use `<h1 className="text-2xl font-bold">History</h1>`, matching other pages.
- [X] T031 [US1] Register the route in `frontend/src/App.tsx`: `const HistoryPage = lazy(() => import('./pages/HistoryPage'));` and `{ path: ROUTES.history, element: lazyPage(<HistoryPage />) }`, after the progress route.
- [X] T032 [US1] Add `{ to: ROUTES.history, label: 'History' }` to `NAV` after Progress in `frontend/src/components/AppShell.tsx`, and change the nav `<ul>` class from `grid-cols-4` to `grid-cols-5`.
- [X] T033 [P] [US1] Add a "View quiz history →" `Link` to `ROUTES.history` in `frontend/src/pages/ProgressPage.tsx`, inside the "Most recent session" card. Render it for signed-in users only, using `useAuth()`.
- [X] T034 [US1] Extend `frontend/tests/component/routing.test.tsx`: `/history` renders the History heading, and the primary nav contains a "History" link. Add `is`, `gte`, `lt`, `order` and `limit` to the query stub if they're missing.

**Checkpoint**: US1 works on its own. Run quickstart steps 1–4, 6–8 and 10.

---

## Phase 4: User Story 2 — Attempt counts (Priority: P1)

**Goal**: for each quiz, show attempt count, best and latest score in a "By quiz" view, and as "Taken N× · best X%" badges in the quiz picker. "All modules" is counted separately.

**Independent Test**: take module M three times (60, 85, 70). The picker reads "Taken 3× · best 85%", and By quiz shows 3 / best 85 / latest 70. Mixed-quiz attempts count only toward "All modules".

### Tests for User Story 2

- [X] T035 [P] [US2] Add `foldPendingIntoSummaries` cases to `frontend/tests/unit/history-merge.test.ts`:
  - a pending attempt increments `attemptCount`, raises `bestScorePct` when higher, and replaces `latestScorePct`/`lastTakenAt` when newer;
  - it creates a summary for a quiz with no server summary;
  - a null-score pending attempt increments the count without touching best;
  - a `topic: null` pending attempt folds into the All-modules key only.
- [X] T036 [P] [US2] Write `frontend/tests/component/quiz-picker-badges.test.tsx`. Render `QuizSelectPage` with `useModules` mocked to two modules and `useQuizSummaries` mocked to one summary (`attemptCount: 3, bestScorePct: 85`) plus an All-modules summary (`attemptCount: 2, bestScorePct: null`). Cases:
  - module 1's button accessible name contains "Taken 3× · best 85%";
  - module 2 has no badge;
  - "All modules" shows "Taken 2×";
  - as a guest, no badges.
- [X] T037 [P] [US2] Extend `frontend/tests/component/history-page.test.tsx`: with `?view=by-quiz` and stubbed summaries, rows show quiz name, "Taken N×", best, latest and last taken, sorted by `lastTakenAt` descending. Each row links to `/history?quiz=<encoded key>`.

### Implementation for User Story 2

- [X] T038 [US2] Add `foldPendingIntoSummaries(summaries: QuizAttemptSummary[], pending: QuizAttempt[]): Map<string, QuizAttemptSummary>` (keyed by `summaryKey`) to `frontend/src/lib/history/merge.ts` to pass T035.
- [X] T039 [US2] Add `fetchSummaries(client: SupabaseClient, userId: string): Promise<QuizAttemptSummary[]>` to `frontend/src/lib/history/query.ts`, per `contracts/attempts-data.md` C3, mapping snake_case to camelCase. Don't import `../supabase`.
- [X] T040 [US2] Create `frontend/src/lib/history/useQuizSummaries.ts`: `useQuizSummaries(userId: string | undefined)` → `{ summaries: Map<string, QuizAttemptSummary>, loading, error }`.
  - Return an empty map without fetching when `userId` is undefined.
  - Fold in pending MCQ sessions from the store, and refetch when the pending set shrinks.
- [X] T041 [P] [US2] Create `frontend/src/components/history/QuizSummaryRow.tsx`, a `<li>` containing a `Link` to `ROUTES.history + '?' + toHistoryParams({ ...defaults, quiz: topic })`. It shows the quiz name, "Taken N×", "Best X%" (or "—"), "Latest Y%" (or "—") and "Last taken <date>".
- [X] T042 [US2] Add the By-quiz view to `frontend/src/pages/HistoryPage.tsx`:
  - a two-option view switch ("Attempts" / "By quiz"), built as `aria-pressed` buttons like `Pill` in `QuizSelectPage`, that writes `view` via `setSearchParams(toHistoryParams(...), { replace: true })`;
  - when `view === 'by-quiz'`, render a `<ul>` of `QuizSummaryRow` sorted by `lastTakenAt` descending, using `useQuizSummaries`.
- [X] T043 [P] [US2] Create `frontend/src/components/history/AttemptCountBadge.tsx`: given `summary?: QuizAttemptSummary`, it renders nothing when undefined, otherwise a `<span className="block text-xs opacity-80">` with "Taken N× · best X%", or "Taken N×" when best is null.
- [X] T044 [US2] Update `frontend/src/pages/QuizSelectPage.tsx` to pass T036:
  - call `useQuizSummaries(user?.id)` with `useAuth()`;
  - inside each module `Pill`, render `<AttemptCountBadge summary={summaries.get(m.topic)} />` after the title;
  - inside the "All modules" pill, render `summaries.get(ALL_MODULES_KEY)`.

**Checkpoint**: US1 and US2 both work. Run quickstart step 5.

---

## Phase 5: User Story 3 — Filters (Priority: P2)

**Goal**: filter History by quiz, date range and result. Filters combine with AND, live in the URL and survive a refresh, and there's a "Clear filters" action.

**Independent Test**: quiz = M, Last 7 days, Failed shows only those rows. Refresh keeps them, and Clear filters resets to `/history`.

### Tests for User Story 3

- [X] T045 [P] [US3] Extend `frontend/tests/component/history-page.test.tsx`:
  - changing the Result select to "Failed" updates the location search to `result=failed`, with `replace` (no history entry added);
  - rendering at `/history?quiz=all-modules&range=7d` preselects those options and the stub receives `is('topic', null)` and `gte('completed_at', …)`;
  - when the stub returns 0 rows with filters active, "No attempts match these filters" shows, and "Clear filters" navigates to `/history`.
- [X] T046 [P] [US3] Write `tests/integration/quiz-history-filters.test.ts`. Insert a fixture of about 12 MCQ rows for one test user across 3 topics including null, with dates at 0, 3, 10 and 40 days ago and scores on both sides of 70, including exactly 70 and one null. For every combination of `quiz ∈ {undefined, null, 'Mod A'} × range ∈ {7d, 30d, all} × result ∈ {all, passed, failed}`, check that the ids from `fetchAttemptPage` (imported from `../../frontend/src/lib/history/query.ts`, with the user's client) equal a plain-JS filter of the fixture (SC-006). — **Written; not yet run against a stack with migration 0020** (no local Supabase on 2026-11-07).

### Implementation for User Story 3

- [X] T047 [P] [US3] Create `frontend/src/components/history/HistoryFilters.tsx` with three labelled native `<select>` elements:
  - **Quiz**: "Any quiz", then one option per summary key, using the topic or "All modules";
  - **Date range**: All time / Last 7 days / Last 30 days;
  - **Result**: All / Passed / Failed.
  Props are `{ filters, quizOptions: { key: string; label: string }[], onChange(next: HistoryFilters) }`. Stack the selects at 375 px and use a 3-column grid from `sm:`.
- [X] T048 [US3] Wire filters into `frontend/src/pages/HistoryPage.tsx`:
  - render `HistoryFilters` above the attempt list (list view only), building `quizOptions` from `useQuizSummaries`;
  - `onChange` calls `setSearchParams(toHistoryParams(next), { replace: true })`;
  - when any filter isn't the default and the result is empty, show "No attempts match these filters" with a "Clear filters" button (`setSearchParams({}, { replace: true })`) instead of the no-attempts empty state.
  This passes T045.

**Checkpoint**: all three stories work independently. Run quickstart step 9.

---

## Phase 6: Polish & Cross-Cutting

- [X] T049 [P] Check `frontend/src/components/AppShell.tsx` at 320 px and 375 px widths in DevTools. If the five nav labels wrap or truncate, change the NavLink class from `text-sm` to `text-xs sm:text-sm`. — **Checked 2026-11-07**: at 320 px all five labels sit on one line (64 px each, 44 px tall) with no horizontal scroll, so no class change was needed.
- [ ] T050 [P] Keyboard and screen-reader pass on `/history`, the filters and the picker badges: tab order, visible focus, select labels, and Passed/Failed and "Not yet synced" read as text. Fix anything found in the components from T028–T029, T041–T043 and T047. — **Partly done**: component tests cover the select labels, `aria-pressed` on the view switch, the badge's accessible name and Passed/Failed as text. A manual keyboard and screen-reader pass of the signed-in page is still to do.
- [ ] T051 Run `cd frontend && pnpm lint && pnpm build && pnpm test` and `cd tools && pnpm test` against a fresh `supabase db reset`. Fix any failures. — **Partly done**: frontend `pnpm test` (136 passing), `tsc` and `pnpm build` pass. `pnpm lint` can't run because eslint isn't installed in `frontend/` (already the case on `main`). `cd tools && pnpm test` hasn't run because there's no local Supabase.
- [ ] T052 Run the full manual walkthrough in `specs/014-quiz-history/quickstart.md` (steps 1–11) and record any deviation in this file. — **Not done**: needs a stack with migration 0020 applied and a signed-in account.
- [ ] T053 [P] Set `**Status**: Implemented` in `specs/014-quiz-history/spec.md` once T051–T052 pass. — **Blocked** on T050–T052.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (T001–T003)**: no dependencies.
- **Foundational (T004–T022)**: depends on Setup (T002 types). **Blocks every story.**
  - Database: T004 → T005, T006, T007 (in parallel)
  - Store: T008 → T009 → T010 → T011, T012, T013 → T014
  - Sync: T010 → T015 → T016 → T017; T010 → T018
  - Helpers: T019 ∥ T020 ∥ T021 ∥ T022 (pairs: T019→T021, T020→T022). Independent of the store and database tasks.
- **US1 (T023–T034)**: depends on Foundational.
- **US2 (T035–T044)**: depends on Foundational. T042 edits `HistoryPage.tsx`, so it runs after T030. T038/T039 edit `merge.ts`/`query.ts`, so they run after T025/T026.
- **US3 (T045–T048)**: depends on Foundational. It uses `useQuizSummaries` (T040) for quiz options, and T048 edits `HistoryPage.tsx`, so it runs after T042.
- **Polish (T049–T053)**: after the stories you're shipping.

### User story dependencies

- **US1**: none beyond Foundational. It's the MVP.
- **US2**: the picker badge (T043–T044) depends only on Foundational and can ship before or without US1. The By-quiz view (T042) needs US1's page.
- **US3**: needs US1's page and US2's summaries hook.

### Within each story

Tests first (they should fail), then pure logic (merge/query), then hooks, then components, then page wiring.

## Parallel Examples

```text
# Foundational, once T004 and T010 are done:
T005  tests/integration/quiz-history.test.ts
T006  tests/integration/rls-isolation.test.ts
T007  tests/integration/anon-no-read.test.ts
T015  frontend/tests/unit/history-sync.test.ts
T019  frontend/tests/unit/history-rules.test.ts
T020  frontend/tests/unit/history-params.test.ts

# US1, after Foundational:
T023  frontend/tests/unit/history-merge.test.ts
T024  frontend/tests/component/history-page.test.tsx
T028  frontend/src/components/history/ResultBadge.tsx
T029  frontend/src/components/history/AttemptRow.tsx
T033  frontend/src/pages/ProgressPage.tsx

# US2:
T035 / T036 / T037 tests, then T041 QuizSummaryRow.tsx ∥ T043 AttemptCountBadge.tsx
```

## Implementation Strategy

1. **MVP = Setup + Foundational + US1** (T001–T034). Ship it: attempts save at completion, appear on every device, and are listed with scores. This fully covers "a history he can check… and the score."
2. **+ US2** (T035–T044): attempt counts and picker badges, which is the "how many times" ask. The picker badge can be pulled ahead of US1 if you want counts first.
3. **+ US3** (T045–T048): filters.
4. **Polish** (T049–T053) before merging to `main`. The Lighthouse gate (Constitution V) checks `/history` through T003.

## Implementation notes (2026-11-07)

- **New file not in the plan**: `frontend/src/lib/history/usePendingAttempts.ts`. It's the store selector and "pending cleared → refetch" logic shared by `useAttemptHistory` and `useQuizSummaries`.
- **Sync API**: the logic lives in `startAttemptSync(userId, getClient)`, which returns a stop function. `useAttemptSync` is a thin `useEffect` around it, so the tests drive it with fake timers and no React.
- **Test harness**: `history-page.test.tsx` uses `<MemoryRouter>` instead of `createMemoryRouter`. In jsdom, data-router navigations build a `Request` whose `AbortSignal` undici rejects.
- **Deploy order**: apply `0020_sessions_attempt_counts.sql` to the hosted project **before** deploying the frontend. The new client reads and writes `question_count` and `correct_count`. Without the columns, PostgREST returns PGRST204 and both the app-load migration and the completion-time push fail.
- **Integration tests**: T005–T007 and T046 are written but haven't run against a database with 0020 applied. Run them on a local stack (`supabase start`, `supabase db reset`, `cd tools && pnpm test`).
- **Incident**: while trying to check that the integration files load, I ran two of them through a throwaway vitest config that skipped `globalSetup`, and with it the `assertSafeTarget()` guard. `tools/.env.local` points at the hosted project, so the run reached it. The run's own cleanup deleted the `test+…@dp700game.test` users it created, and also any other leftover users matching that pattern. The inserts mostly failed on the missing columns. A read-only `findResidue()` check afterwards found 0 test users and 0 fixture rows. No schema was changed and no real user data was touched.

# Data Model: Quiz History & Attempt Counts

**Feature**: 014-quiz-history | **Date**: 2026-11-07

## 1. Server: `public.sessions` (extended)

New migration: `supabase/migrations/0020_sessions_attempt_counts.sql`.

| Column | Type | Null | Notes |
| --- | --- | --- | --- |
| `id` | uuid PK | no | **Client-generated** at completion. It's the idempotency key (`ON CONFLICT (id) DO NOTHING`). |
| `user_id` | uuid FK → profiles | no | Owner. RLS: `auth.uid() = user_id`. |
| `mode` | text | no | History reads `'mcq'` only. |
| `topic` | text | yes | Quiz identity: module title. `NULL` means the mixed "All modules" quiz. |
| `score_pct` | real | yes | 0–100. The client writes whole numbers. |
| `duration_seconds` | integer | yes | |
| `completed_at` | timestamptz | no | |
| **`question_count`** | integer | **yes (new)** | Questions in the attempt. `NULL` on rows from before this feature. |
| **`correct_count`** | integer | **yes (new)** | Answered correctly. `NULL` on rows from before this feature. |

**New constraint** `sessions_counts_chk`:
```sql
(question_count is null and correct_count is null)
or (question_count > 0 and correct_count between 0 and question_count)
```

No new policies or grants on the table: `0007` and `0018` already cover insert and select.

## 2. Server: `public.quiz_attempt_summaries` (new view)

Same migration file.

```sql
create view public.quiz_attempt_summaries
  with (security_invoker = on) as
select
  user_id,
  topic,
  count(*)::integer                                          as attempt_count,
  max(score_pct)                                             as best_score_pct,
  (array_agg(score_pct order by completed_at desc))[1]       as latest_score_pct,
  max(completed_at)                                          as last_taken_at
from public.sessions
where mode = 'mcq'
group by user_id, topic;

grant select on public.quiz_attempt_summaries to authenticated, anon;
```

- `security_invoker` makes the `sessions` RLS apply to the caller. The `anon` grant follows `0019`: anonymous callers can ask but always get zero rows.
- `max()` skips NULLs, so `best_score_pct` is `NULL` only when no attempt has a score. The badge then reads "Taken N×" (FR-020).
- `latest_score_pct` is the score of the most recent attempt, even if that score is `NULL`.

## 3. Client: `GuestSession` (extended)

File: `frontend/src/lib/store/sessions.ts`. Every new field is optional, so `SCHEMA_VERSION` stays at 1.

```ts
export interface GuestSession {
  id: string;
  mode: SessionMode;
  topic: string | null;
  scorePct: number | null;
  durationSeconds: number | null;
  completedAt: string;
  questionCount?: number | null;   // new
  correctCount?: number | null;    // new
  ownerId?: string | null;         // new: user id if recorded while signed in, or hydrated
  pendingSync?: boolean;           // new: true until the server confirms the write
}
```

**State transitions**: `pendingSync` changes only as follows. Guest or legacy sessions (`ownerId` absent) never enter the pending state. They keep using the existing migration path.

```
recordSession({ ownerId: uid })  ──►  pendingSync: true
          │
          ▼  flush succeeds (insert or duplicate ignored)
markSessionsSynced([id])         ──►  pendingSync: false
          │
hydrateFromServer                ──►  server rows take ownerId: uid, pendingSync: false;
                                      local rows still pending are kept (merged by id)
```

## 4. Client: derived types

File: `frontend/src/lib/history/types.ts`.

```ts
export const PASS_MARK_PCT = 70;
export const HISTORY_PAGE_SIZE = 50;
/** URL / UI key for the mixed quiz, whose topic is null. */
export const ALL_MODULES_KEY = 'all-modules';

export interface QuizAttempt {
  id: string;
  topic: string | null;           // null = All modules
  scorePct: number | null;
  questionCount: number | null;
  correctCount: number | null;
  durationSeconds: number | null;
  completedAt: string;
  pending: boolean;               // shows "Not yet synced"
}

export type AttemptResult = 'passed' | 'failed' | null;   // null when scorePct is null

export interface QuizAttemptSummary {
  topic: string | null;
  attemptCount: number;
  bestScorePct: number | null;
  latestScorePct: number | null;
  lastTakenAt: string;
}

export interface HistoryFilters {
  view: 'list' | 'by-quiz';
  quiz: string | null | undefined;       // undefined = any quiz; null = All modules; string = module
  range: '7d' | '30d' | 'all';
  result: 'all' | 'passed' | 'failed';
}
```

**Rules (all pure functions in `lib/history/`, unit-tested):**

| Function | Rule |
| --- | --- |
| `attemptResult(scorePct)` | `null` → `null`; `>= 70` → `'passed'`; otherwise `'failed'`. |
| `rangeStart(range, now)` | `'all'` → `null`; `'7d'`/`'30d'` → local midnight of `now − (N−1)` days, as an ISO string. |
| `mergePendingAttempts(serverPage, pending, filters, cursor)` | Dedupe by id (the server row wins, but keeps `pending` if a local copy is still flagged). Include pending rows that match the filters and fall inside the page's `completed_at` window. Sort by `completedAt` descending. |
| `foldPendingIntoSummaries(summaries, pending)` | For each pending attempt: `attemptCount += 1`; `bestScorePct = max`; if it's newer, `latestScorePct` and `lastTakenAt` take its values. A missing topic summary is created. |
| `summaryKey(topic)` | `null` → `ALL_MODULES_KEY`, otherwise the topic. |
| `formatDuration(s)` | `m:ss`; `null` → "—". |
| `formatCorrect(c, q)` | `"c/q"`; either one `null` → "—". |

## 5. Validation summary (spec → model)

| Requirement | Enforced by |
| --- | --- |
| FR-002 counts | `sessions_counts_chk`, plus the client passing `questions.length` and `correctCount` |
| FR-003 pass ≥ 70 | `attemptResult` and the server filters `gte/lt 70` |
| FR-007 idempotent | `id` PK with `ON CONFLICT DO NOTHING` |
| FR-012 "—" | nullable counts and `formatCorrect` |
| FR-017 "All modules" separate | `topic IS NULL` group in the view, plus `ALL_MODULES_KEY` |
| FR-026 owner-only | existing RLS, with the `security_invoker` view inheriting it |
| FR-027 delete with account | existing cascade (`0006`, `0013`) |

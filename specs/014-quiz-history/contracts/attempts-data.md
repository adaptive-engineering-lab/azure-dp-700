# Contract: Attempt Data (Supabase)

All calls use the browser `anon`-key client with the learner's session (Constitution IV). RLS on `public.sessions` limits every call to `auth.uid() = user_id`.

## C1. Save an attempt (idempotent)

Used by `lib/history/sync.ts` (pending flush) and `lib/migration/execute.ts` (app-load migration).

```ts
client.from('sessions').upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
// → INSERT ... ON CONFLICT (id) DO NOTHING
```

Row shape:

```ts
{
  id: string;              // GuestSession.id (client uuid)
  user_id: string;         // signed-in user id; RLS rejects anything else
  mode: 'mcq';
  topic: string | null;    // null = All modules
  score_pct: number;       // 0–100, whole number
  question_count: number;  // > 0
  correct_count: number;   // 0..question_count
  duration_seconds: number;
  completed_at: string;    // ISO, from the client at completion
}
```

| Outcome | Client action |
| --- | --- |
| `error === null` (inserted, or duplicate ignored) | `markSessionsSynced(ids)` |
| Network failure or 5xx | Keep `pendingSync`. Retry on backoff or on the `online` event. |
| 401 (session expired) | Keep `pendingSync`. Flush again after `onAuthStateChange` delivers a refreshed session. |
| 4xx check violation (bad counts) | Log, and keep `pendingSync` (won't happen with valid client data; covered by a unit test). |

**Guarantee**: N sends of the same `id` leave exactly one row (SC-003).

## C2. List attempts (one page)

```ts
let q = client
  .from('sessions')
  .select('id, topic, score_pct, question_count, correct_count, duration_seconds, completed_at')
  .eq('user_id', userId)
  .eq('mode', 'mcq');

if (filters.quiz === null)          q = q.is('topic', null);         // All modules
else if (filters.quiz !== undefined) q = q.eq('topic', filters.quiz);
if (since)                          q = q.gte('completed_at', since); // rangeStart()
if (filters.result === 'passed')    q = q.gte('score_pct', 70);
if (filters.result === 'failed')    q = q.lt('score_pct', 70);
if (cursor)                         q = q.or(                         // last row's (completed_at, id)
  `completed_at.lt."${cursor.completedAt}",and(completed_at.eq."${cursor.completedAt}",id.lt.${cursor.id})`);

q.order('completed_at', { ascending: false })
 .order('id', { ascending: false })
 .limit(HISTORY_PAGE_SIZE + 1);
```

- If 51 rows come back, `hasMore = true` and the 51st is dropped. The next cursor is the 50th row's `{ completedAt, id }`. The id breaks ties: with a `completed_at`-only cursor, attempts finished at the same instant on both sides of a page break would lose the later ones.
- Rows with `score_pct IS NULL` never match `gte` or `lt`, so they're left out under Passed or Failed. That's intended (data-model §4).

## C3. Per-quiz summaries

```ts
client
  .from('quiz_attempt_summaries')
  .select('topic, attempt_count, best_score_pct, latest_score_pct, last_taken_at')
  .eq('user_id', userId)
  .order('last_taken_at', { ascending: false });
```

Used by History's "By quiz" view, by the History quiz-filter options and by the picker badges. Results are folded with local pending attempts (`foldPendingIntoSummaries`).

## C4. Isolation guarantees (integration-tested)

| Caller | `sessions` | `quiz_attempt_summaries` | Insert someone else's `user_id` |
| --- | --- | --- | --- |
| Owner | own rows | own rows | — |
| Other user | 0 rows | 0 rows | rejected (RLS) |
| anon | 0 rows | 0 rows | rejected |

# Quickstart: Quiz History & Attempt Counts

How to run and check feature 014 locally.

## Setup

```sh
supabase start                     # local stack (Postgres 17)
supabase db reset                  # applies migrations including 0020_sessions_attempt_counts.sql
cd tools && pnpm seed              # seed the question bank
cd ../frontend && pnpm install && pnpm dev   # http://127.0.0.1:5173
```

## Automated checks

```sh
cd frontend && pnpm test           # unit + component: lib/history/*, store, migration, HistoryPage
cd tools && pnpm test              # integration against local Supabase: RLS, idempotency, view
cd frontend && pnpm build && pnpm lint
```

## Manual walkthrough

1. **Guest prompt**: signed out, open `/history`. You should see the sign-in prompt and no list. The picker shows no badges.
2. **Record (US1)**: sign in, finish a module quiz, and open History from the bottom nav. The top row shows module, time, score, X/Y, m:ss and Passed/Failed.
3. **Pass boundary**: finish a quiz at exactly 70%. It shows **Passed**.
4. **Mid-quiz exit**: start a quiz, answer two questions and leave. History doesn't change.
5. **Counts (US2)**: take the same module three times. The picker reads "Taken 3× · best N%". "By quiz" shows 3 attempts, plus best and latest. Take "All modules" once and check it counts separately.
6. **Cross-device (SC-001)**: in a second browser profile signed in as the same user, open `/history`. The attempts from step 2 are listed without a reload on the first device.
7. **Offline (SC-002)**: in DevTools, set Network to Offline and finish a quiz. Results appear instantly, and History shows the row with "Not yet synced". Go back online; within about 10 s the marker clears, and the second profile shows it exactly once.
8. **Reload while pending**: repeat step 7, but reload while still offline before going back online. The row is still pending and syncs once you're online.
9. **Filters (US3)**: set Quiz, Last 7 days and Failed. Only matching rows show. Refresh, and the filters persist in the URL. "Clear filters" resets them.
10. **Load more**: with 51 or more attempts (seed them with `tools` test helpers or SQL), the first 50 show, then "Load more" adds the rest with no duplicates.
11. **Legacy rows**: an attempt recorded before this feature (NULL counts) shows "—" in X/Y and still counts toward its quiz's attempts.

## Lighthouse

`/history` is added to `.lighthouserc.json` `collect.url`. The existing CI gate (Accessibility ≥ 0.9) covers it. Unauthenticated, it renders the sign-in-prompt state.

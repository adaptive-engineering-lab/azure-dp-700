# Implementation Plan: Quiz History & Attempt Counts

**Branch**: `014-quiz-history` | **Date**: 2026-11-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-quiz-history/spec.md`

## Summary

Signed-in learners get a `/history` page that lists every completed MCQ quiz (module or "All modules") with score, X/Y, duration and Passed/Failed at 70%. It has a "By quiz" view of attempt count, best and latest score, and filters (quiz, 7/30 days/all, passed/failed) kept in the URL. Each module in the quiz picker shows a "Taken N× · best X%" badge.

The technical work is mostly about **when** attempts reach the server. Today a finished quiz is stored locally and pushed only on the next app load. The plan:

- Extend `sessions` with `question_count` and `correct_count`.
- Have every attempt finished while signed in flagged `pendingSync` and flushed right away through an idempotent `INSERT … ON CONFLICT (id) DO NOTHING`, with retry and backoff.
- Make hydrate keep attempts that are still pending.
- Read History from the server (keyset pages of 50) and summaries from a new RLS-respecting view, with local pending attempts merged in.

See [research.md](./research.md) for the decisions and the three latent issues this fixes (hydrate dropping pending attempts, a write race on the same id, shared-device cross-migration).

## Technical Context

**Language/Version**: TypeScript 5.5, React 18.3; SQL (Postgres 17, Supabase)
**Primary Dependencies**: Zustand 4.5 (persisted store), React Router 6.26, `@supabase/supabase-js` 2.45, Tailwind 3.4. **No new dependencies.**
**Storage**: Supabase `public.sessions` (extended) and the new view `public.quiz_attempt_summaries`; the localStorage store `dp700game.v1.state` (optional new `GuestSession` fields, no schema-version bump)
**Testing**: Vitest + Testing Library in `frontend/tests/{unit,component}`; Vitest integration against local Supabase in `tests/integration` (run from `tools/`)
**Target Platform**: Mobile-first PWA (375 px first), modern evergreen browsers, offline-capable shell
**Project Type**: Web app (`frontend/` SPA + `supabase/` migrations); no server functions
**Performance Goals**: first 50 History rows in < 2 s on mobile for up to 1,000 attempts (SC-004); cross-device visibility < 10 s (SC-001)
**Constraints**: results screen never waits on the network (FR-005); offline completion is retried until saved (FR-006); exactly one row per attempt (FR-007); anon key only
**Scale/Scope**: ≤ ~1,000 attempts per learner; 1 new page, 1 nav item, 1 picker change, 1 migration (2 columns + 1 view)

## Constitution Check

*GATE: checked before Phase 0 and again after Phase 1 design. Both pass.*

| Principle | Status | Notes |
| --- | --- | --- |
| I. Mobile-First, Thumb-Friendly | Pass | Single-column list. Filters are native `<select>` elements stacked at 375 px. The bottom nav goes from 4 to 5 columns (75 px each). Picker badges are a second line inside the existing pill. |
| II. Domain-Aligned Content | Pass | No content changes. Quiz identity reuses the bank's `topic`. |
| III. AI as Authoring Tool | Pass | No runtime AI. |
| IV. Secrets Server-Side / RLS | Pass | Anon-key client only. `sessions` RLS is unchanged. The new view is `security_invoker`, so it inherits RLS. The anon grant follows `0019` and returns zero rows. Integration tests extend the RLS-isolation and anon suites. |
| V. Measurable Quality Gates | Pass | `/history` is added to `.lighthouserc.json` (a11y ≥ 0.9). Pass/fail uses text and a glyph, not color (FR-028). Migration is checked in CI by the `data-layer` workflow. |

No violations, so Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/014-quiz-history/
├── spec.md
├── plan.md               # this file
├── research.md           # decisions + latent issues
├── data-model.md         # sessions columns, view, client types, pure rules
├── quickstart.md         # run + manual walkthrough
├── contracts/
│   ├── attempts-data.md  # Supabase calls C1–C4
│   ├── history-route.md  # /history URL params, states, row markup, picker badge
│   └── store-and-sync.md # store actions, migration changes, sync + read hooks
├── checklists/requirements.md
└── tasks.md              # /speckit-tasks (not created here)
```

### Source Code

```text
supabase/migrations/
└── 0020_sessions_attempt_counts.sql     # NEW: question_count, correct_count, check, view + grants

frontend/src/
├── lib/
│   ├── routes.ts                         # + history: '/history'
│   ├── store/
│   │   ├── sessions.ts                   # GuestSession + questionCount/correctCount/ownerId/pendingSync
│   │   └── index.ts                      # recordSession (counts, ownerId, returns session),
│   │                                     #   markSessionsSynced, hydrateFromServer keeps pending
│   ├── migration/
│   │   ├── plan.ts                       # buildMigrationPlan({ …, userId }) excludes other owners
│   │   ├── execute.ts                    # sessions: upsert ignoreDuplicates + count columns
│   │   └── hydrate.ts                    # select counts, map ownerId
│   ├── auth/AuthProvider.tsx             # mount useAttemptSync(userId)
│   └── history/                          # NEW
│       ├── types.ts                      # constants + QuizAttempt/Summary/HistoryFilters
│       ├── rules.ts                      # attemptResult, rangeStart, summaryKey, format*
│       ├── params.ts                     # parseHistoryParams / toHistoryParams
│       ├── merge.ts                      # mergePendingAttempts, foldPendingIntoSummaries
│       ├── query.ts                      # fetchAttemptPage (C2), fetchSummaries (C3)
│       ├── sync.ts                       # pushSessions (C1), useAttemptSync
│       ├── useAttemptHistory.ts
│       └── useQuizSummaries.ts
├── components/
│   ├── AppShell.tsx                      # + History nav item, grid-cols-5
│   ├── MigrationPrompt.tsx               # pass user.id to buildMigrationPlan
│   └── history/                          # NEW
│       ├── AttemptRow.tsx
│       ├── ResultBadge.tsx               # Passed/Failed, text + glyph
│       ├── QuizSummaryRow.tsx
│       ├── HistoryFilters.tsx
│       └── AttemptCountBadge.tsx         # picker "Taken N× · best X%"
├── pages/
│   ├── HistoryPage.tsx                   # NEW
│   ├── QuizSessionPage.tsx               # pass questionCount, correctCount, ownerId
│   ├── QuizSelectPage.tsx                # badges via useQuizSummaries
│   └── ProgressPage.tsx                  # + "View quiz history →" link
└── App.tsx                               # + lazy /history route

frontend/tests/
├── unit/
│   ├── history-rules.test.ts             # pass mark boundary, rangeStart (incl. DST), formatters
│   ├── history-params.test.ts            # URL round-trip, unknown values → defaults
│   ├── history-merge.test.ts             # dedupe, pending in filter/page window, summary folding
│   ├── history-sync.test.ts              # flush, markSynced, retry/backoff, owner filter, in-flight guard
│   ├── store-sessions.test.ts            # recordSession pending flag; hydrate keeps pending
│   └── migration.test.ts                 # (extend) other-owner exclusion, upsert path
└── component/
    └── history-page.test.tsx             # guest prompt, empty, filters→URL, load more, pending label

tests/integration/
├── quiz-history.test.ts                  # NEW: idempotent double upsert, counts check, view values
├── rls-isolation.test.ts                 # (extend) view isolation between users
└── anon-no-read.test.ts                  # (extend) anon reads 0 rows from the view

.lighthouserc.json                        # + http://localhost/history
```

**Structure Decision**: this extends the existing `frontend/` SPA and `supabase/migrations/`. Feature logic lives in a new `lib/history/` module. Pure rules are separate from hooks so they can be unit-tested, the same way `lib/dashboard/aggregate.ts` is kept apart from `ProgressPage`.

## Phases

1. **Data layer**: migration `0020` (columns, check, view, grants). Integration tests: double upsert gives one row, the check rejects `correct_count > question_count`, view values for a fixture set, and view isolation for another user and for anon.
2. **Store + write path** (foundational, blocks US1–US3): `GuestSession` fields; `recordSession`, `markSessionsSynced` and hydrate merge; migration `plan` and `execute` changes; `sync.ts` and `useAttemptSync` in `AuthProvider`; `QuizSessionPage` passes counts and owner. Unit tests.
3. **US1 History list**: `rules`, `merge`, `query`, `useAttemptHistory`; `HistoryPage` (guest, empty, error, list, load more, pending label); the route, nav item and Progress link; Lighthouse URL.
4. **US2 Attempt counts**: `useQuizSummaries`, the "By quiz" view, and `AttemptCountBadge` in `QuizSelectPage`.
5. **US3 Filters**: `params.ts`, the `HistoryFilters` bar, the filters wired into the query and into the pending merge, and "Clear filters".
6. **Verify**: run the `quickstart.md` walkthrough, then `pnpm test` (frontend and tools), `pnpm build`, `pnpm lint`.

## Risks

| Risk | Mitigation |
| --- | --- |
| Lost response leaves a row pending after it was saved, so the summary counts it twice for a moment | The next flush (≤ 5 s) clears it, and the list dedupes by id. Documented in research D4. |
| A renamed module splits its counts | Accepted per spec Assumptions; revisit only if titles start changing. |
| A fifth nav tab crowds 320 px screens | Labels are short. Check at 320 px during step 6; fall back to `text-xs`. |
| `security_invoker` view not honored on an older hosted Postgres | Hosted project matches `major_version = 17`; the integration isolation test fails loudly if not. |

## Complexity Tracking

No constitution violations.

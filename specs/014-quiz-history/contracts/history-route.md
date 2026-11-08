# Contract: `/history` Route & UI

## Route

`ROUTES.history = '/history'`. It's lazy-loaded in `App.tsx` and appears as the fifth item in the `AppShell` bottom nav ("History"). It's also linked from `/progress` ("View quiz history →").

## Query parameters

Defaults are omitted. A parameter with an unknown value falls back to its default; it never causes an error.

| Param | Values | Default | Meaning |
| --- | --- | --- | --- |
| `view` | `list` \| `by-quiz` | `list` | Attempt list or per-quiz summaries |
| `quiz` | `all-modules` \| *module title* | *(absent)* = any quiz | `all-modules` is the mixed quiz (`topic IS NULL`) |
| `range` | `7d` \| `30d` \| `all` | `all` | Local calendar days, including today |
| `result` | `passed` \| `failed` \| `all` | `all` | Against 70% |

Examples:

- `/history?quiz=Get%20started%20with%20lakehouses&range=30d&result=failed`
- `/history?view=by-quiz`

`parseHistoryParams(URLSearchParams) → HistoryFilters` and `toHistoryParams(HistoryFilters) → URLSearchParams` must round-trip (unit-tested). Changing a filter uses `setSearchParams(..., { replace: true })`, so filter tweaks don't flood the back history.

## States

| Condition | Renders |
| --- | --- |
| Auth loading | "Loading…" (as on other pages) |
| Guest | Sign-in prompt: "Your quiz history is saved to your account." Link to `ROUTES.signIn`. No data request is made. |
| Signed in, 0 attempts, no filters | Empty state + "Start a quiz" → `ROUTES.quiz` |
| Filters match nothing | "No attempts match these filters" + "Clear filters" (resets to `/history`) |
| Fetch error | Inline error + "Retry". Local pending attempts are still listed. |
| Has more | "Load more" button below the list |

## Attempt row (list view)

`<quiz name> · <date, time (local)> · <score %> · <correct/total or —> · <m:ss or —> · <badge>`

- Quiz name: the topic, or "All modules".
- Badge: text **Passed** or **Failed** with a ✓ or ✕ glyph (`aria-hidden`), so meaning never depends on color (FR-028). There's no badge when the score is null.
- Pending: a "Not yet synced" label (text, not only an icon).
- Markup: a list (`<ul>`/`<li>`). Each row is one block with a readable text order for screen readers.

## Summary row (by-quiz view)

`<quiz name> · Taken N× · Best X% · Latest Y% · Last taken <date>`. The whole row is a link to `/history?quiz=<key>`.

## Filters bar

Three native `<select>` elements (Quiz, Date range, Result), each with a visible `<label>`. Native controls give keyboard and screen-reader support at 375 px with no new dependency. Quiz options come from the C3 summaries (quizzes the learner has taken), plus "Any quiz".

## Picker badge (`QuizSelectPage`)

For a signed-in learner, each module pill whose topic has a summary (and the "All modules" pill) shows a second line:

- `Taken 3× · best 85%`
- `Taken 2×` when `bestScorePct` is null

It's hidden for guests and for quizzes never taken. The badge text is part of the button's accessible name.

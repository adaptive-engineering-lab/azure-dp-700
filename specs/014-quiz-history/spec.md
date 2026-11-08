# Feature Specification: Quiz History & Attempt Counts

**Feature Branch**: `014-quiz-history`
**Created**: 2026-11-07
**Status**: Implemented
**Input**: User description: "Quiz history for signed-in learners. Each completed MCQ quiz (one module or the mixed all-modules quiz) is saved to the learner's account as an attempt, with quiz identity, completed-at time, score %, correct count / question count, duration and pass/fail against a 70% pass mark. Attempts are saved to the server when the quiz finishes, so history shows on every device. A history page, per-module attempt counts with a badge in the quiz picker, and filters by module, date range and pass/fail."

## Background

Finished quizzes are already recorded as sessions (feature 001's `sessions` entity, written by feature 005). Two gaps stop that record from serving as a history:

1. While a learner is signed in, only their profile (streak, level) is saved to their account as they go. Sessions are copied up to the account only when the app next loads, through the same sync that migrates guest data at sign-in. A quiz finished on a phone doesn't appear on a laptop until the phone reopens the app, and if the phone never does, it never appears.
2. A session stores a score percentage but not how many questions there were or how many were answered correctly. "8/10 correct" can't be shown.

Today, `/progress` shows only the single most recent session.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — A Signed-In Learner Reviews the Quizzes They've Completed (Priority: P1)

A signed-in learner opens **History** from the main navigation, or from a link on `/progress`. They see every quiz they've completed, newest first. Each row shows the quiz name (the module title, or "All modules" for the mixed quiz), when it was completed, the score percentage, correct out of total (for example "8/10"), how long it took, and a Passed or Failed badge against the 70% pass mark. Quizzes completed on any of their devices appear.

**Why this priority**: This is the core of the request: "a history he can check of quizzes he completed and the score he got." Without it there's nothing to count or filter. It also fixes the cross-device gap, which every other story relies on.

**Independent Test**: Sign in on device A and complete a module quiz. Sign in to the same account on device B and open History. The attempt appears with the correct module, score, X/Y and duration.

**Acceptance Scenarios**:

1. **Given** a signed-in learner who has completed three quizzes, **When** they open History, **Then** they see three rows, newest first, each showing quiz name, completed date and time, score %, X/Y correct, duration and a Passed/Failed badge.
2. **Given** a learner has just finished a quiz and seen the results screen, **When** they open History, **Then** that attempt is the top row.
3. **Given** a learner completed a quiz on another device, **When** they open History on this device, **Then** that attempt is listed.
4. **Given** a learner scores exactly 70%, **When** the row renders, **Then** it shows **Passed**.
5. **Given** a signed-in learner with no completed quizzes, **When** they open History, **Then** they see an empty state with a call to action to start a quiz, and no blank table.
6. **Given** a guest (not signed in), **When** they open History, **Then** they see a prompt explaining that history is saved to an account, with a sign-in action and no attempt list.
7. **Given** a learner with more than 50 attempts, **When** they open History, **Then** the 50 most recent are shown along with a "Load more" control that adds the next 50.

---

### User Story 2 — A Learner Sees How Many Times They've Taken Each Quiz (Priority: P1)

For every quiz the learner has completed, the app shows how many times they've taken it, their best score and their most recent score. This appears in two places. History has a "By quiz" view with one summary row per quiz. In the quiz picker, each module the learner has taken shows a badge such as "Taken 3× · best 85%". The mixed all-modules quiz is counted separately as "All modules".

**Why this priority**: This is the second explicit ask, "the amount of times that he has done a particular quiz." Showing it in the picker puts it at the moment the learner chooses what to study, which is where it's most useful.

**Independent Test**: Complete the same module quiz three times with scores of 60%, 85% and 70%. The picker badge for that module reads "Taken 3× · best 85%". In History's "By quiz" view, that module shows 3 attempts, best 85%, latest 70%.

**Acceptance Scenarios**:

1. **Given** a learner has taken module M three times (60%, 85%, 70%, in that order), **When** they view the quiz picker, **Then** module M shows "Taken 3× · best 85%".
2. **Given** a learner has never taken module N, **When** they view the quiz picker, **Then** module N shows no badge.
3. **Given** a learner has taken the mixed quiz twice and module M once, **When** they open "By quiz", **Then** "All modules" shows 2 attempts and module M shows 1. Mixed-quiz attempts don't count toward any individual module.
4. **Given** the "By quiz" view, **When** it renders, **Then** each row shows quiz name, attempt count, best score, latest score and date last taken, sorted by most recently taken.
5. **Given** the learner selects a quiz in "By quiz", **When** the selection is made, **Then** the attempt list opens filtered to that quiz.
6. **Given** a guest views the quiz picker, **When** it renders, **Then** no attempt badges are shown.

---

### User Story 3 — A Learner Filters Their History (Priority: P2)

On History, the learner can narrow the list by quiz, by date range (Last 7 days / Last 30 days / All time) and by result (All / Passed / Failed). Filters can be combined. They're reflected in the page address, so a filtered view survives a refresh and can be bookmarked.

**Why this priority**: Once history grows past a screen or two, filters turn it into a study tool, for example "Which quizzes have I failed this month?" It's P2 because the unfiltered list and counts already meet the core need.

**Independent Test**: With attempts across several modules and dates, some passed and some failed, set quiz = M, range = Last 7 days, result = Failed. Only failed attempts of M from the last 7 days are listed. Refresh the page and the same filters and results remain.

**Acceptance Scenarios**:

1. **Given** attempts across several quizzes, **When** the learner picks quiz M, **Then** only attempts of M are listed.
2. **Given** the learner picks Last 7 days, **When** the list updates, **Then** only attempts completed today or in the previous 6 calendar days (learner's local time) are shown.
3. **Given** the learner combines quiz, date range and result filters, **When** the list updates, **Then** only attempts matching all three are shown.
4. **Given** the filters match nothing, **When** the list updates, **Then** a "No attempts match these filters" message appears with a "Clear filters" action.
5. **Given** a filtered view, **When** the learner refreshes or opens the bookmarked address, **Then** the same filters are applied.

---

### Edge Cases

- **Quiz left part-way through**: navigating away, closing the tab or reloading before the last question is answered records nothing, and the attempt count doesn't change.
- **Offline at completion**: the results screen still appears immediately. The attempt is kept on the device and saved to the account automatically when the connection returns, including after a reload or a later visit. On that device, History lists it right away with a "Not yet synced" marker.
- **Save retried or sent twice** (flaky network, two tabs, retry after a timeout): the attempt is stored exactly once.
- **Attempts recorded before this feature**: older attempts with no correct/total counts show "—" in the X/Y column. They still count toward attempt totals and best/latest score.
- **Attempts with no score at all**: they count toward attempts but are left out of best score. If no attempt of a quiz has a score, the badge reads "Taken N×" with no best score.
- **Quizzes finished while signed in on this device before this feature shipped**, which never reached the account: they're saved to the account once, the first time the learner uses the app signed in after release, with no duplicates.
- **Signing out on a shared device**: History and picker badges stop showing the previous learner's attempts.
- **A module later removed from the question bank**: its past attempts stay in History under the name recorded at the time. It doesn't appear in the picker, so it gets no badge.
- **Score of 0%**: the attempt is recorded and shown as Failed.
- **Clock and time zone**: dates are shown in the learner's local time. "Last 7 days" uses local calendar days.

## Requirements *(mandatory)*

### Functional Requirements

#### Recording attempts

- **FR-001**: When a signed-in learner answers the last question of an MCQ quiz (a single-module quiz or the mixed all-modules quiz), the system MUST record one attempt in the learner's account.
- **FR-002**: Each attempt MUST capture: which quiz was taken (module title, or "All modules" for the mixed quiz), completion date and time, score percentage (whole number, 0–100), number of questions, number answered correctly, and duration.
- **FR-003**: Pass/fail MUST be derived from score: **Passed** when the score is at least 70%, otherwise **Failed**.
- **FR-004**: A quiz that isn't finished MUST NOT produce an attempt.
- **FR-005**: Recording an attempt MUST NOT delay or block the results screen.
- **FR-006**: If the attempt can't be saved to the account at completion (offline or a server error), the system MUST keep it on the device and retry automatically until it succeeds. Retries MUST survive a reload.
- **FR-007**: Saving MUST be idempotent: however many times the save of an attempt is sent or retried, the account holds exactly one copy.
- **FR-008**: MCQ attempts completed while signed in on the current device that aren't yet in the account, including ones from before this feature, MUST be saved to the account once, without duplicates.
- **FR-009**: Attempts in other modes (code review, daily review, flashcards) are outside this feature and MUST NOT appear in History or in attempt counts.

#### History list (US1)

- **FR-010**: The app MUST provide a History page reachable from main navigation and from a link on `/progress`.
- **FR-011**: For a signed-in learner, History MUST list their attempts from all devices, newest first. Each row MUST show quiz name, completed date and time (local), score %, correct/total, duration and a Passed/Failed badge.
- **FR-012**: Where correct/total isn't known for an attempt, that cell MUST show "—".
- **FR-013**: History MUST show the 50 most recent matching attempts first, with a "Load more" control that loads the next 50 until none remain.
- **FR-014**: With no attempts, History MUST show an empty state with an action to start a quiz.
- **FR-015**: A guest opening History MUST see a sign-in prompt and no attempt data.
- **FR-016**: An attempt waiting to be saved MUST appear in History on the device that recorded it, marked "Not yet synced". The marker MUST disappear once it's saved.

#### Attempt counts (US2)

- **FR-017**: For each quiz the learner has taken, the system MUST compute attempt count, best score, latest score and date last taken. The mixed quiz is counted as its own quiz, "All modules".
- **FR-018**: History MUST offer a "By quiz" view listing those per-quiz summaries, sorted by date last taken, newest first.
- **FR-019**: Selecting a quiz in "By quiz" MUST open the attempt list filtered to that quiz.
- **FR-020**: For a signed-in learner, each module in the quiz picker that they've taken at least once MUST show a badge with attempt count and best score (for example "Taken 3× · best 85%"). Modules never taken MUST show no badge. When no attempt of a quiz has a score, the badge MUST read "Taken N×".
- **FR-021**: Counts and badges MUST reflect a just-finished attempt as soon as the learner returns to the picker or History on the same device, even while it's still waiting to be saved.

#### Filters (US3)

- **FR-022**: History MUST offer filters for quiz (any quiz the learner has taken), date range (Last 7 days / Last 30 days / All time) and result (All / Passed / Failed). The defaults are all quizzes, All time and All.
- **FR-023**: Filters MUST combine with AND logic.
- **FR-024**: Active filters MUST be reflected in the page address. Opening that address MUST restore them.
- **FR-025**: When the filters match nothing, History MUST show a "No attempts match these filters" message with a "Clear filters" action.

#### Privacy & accessibility

- **FR-026**: A learner MUST only ever see their own attempts. No other user can read or change them.
- **FR-027**: Attempts MUST be deleted along with the learner's account, as the existing account-deletion flow already does for sessions.
- **FR-028**: Passed/Failed MUST be shown in text (and may also use an icon), never by color alone. History, its filters and the picker badges MUST meet WCAG 2.1 AA in light and dark themes and be fully keyboard operable.

### Key Entities

- **Quiz Attempt**: one completed MCQ quiz by one learner. It holds quiz identity (module title or "All modules"), completed-at, score %, question count, correct count, duration, and a stable attempt identifier created when the quiz finishes, used to keep saves idempotent. Pass/fail is derived, not stored. It extends the existing `sessions` entity (mode = MCQ) instead of introducing a separate record.
- **Quiz Attempt Summary**: a per-learner, per-quiz rollup computed from Quiz Attempts: attempt count, best score, latest score, date last taken.
- **Pending Attempt**: a Quiz Attempt kept on the device until it's saved to the account.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of test runs, a quiz finished on one device appears in History on a second signed-in device within 10 seconds of completion while both are online.
- **SC-002**: In 100% of test runs, a quiz finished offline appears in the account within 10 seconds of the connection returning, with no duplicate.
- **SC-003**: Across repeated test runs that resend the same attempt (retries, two tabs), the attempt count rises by exactly one per finished quiz.
- **SC-004**: History shows its first 50 rows within 2 seconds on a typical mobile connection, for a learner with up to 1,000 attempts.
- **SC-005**: Picker badges and "By quiz" counts match a manual count of the learner's attempts in 100% of automated comparisons, including the separate "All modules" count.
- **SC-006**: Every combination of filters returns exactly the attempts matching all of them, checked by automated comparison against the underlying data.
- **SC-007**: In usability checks, a learner can answer "How many times have I taken module X, and what was my best score?" in under 10 seconds from the home screen.
- **SC-008**: Lighthouse Accessibility ≥ 90 on History, consistent with the project's existing gate (feature 012).

## Assumptions

- The pass mark is 70% (≥ 70% passes). That matches the DP-700 exam's pass bar of 700/1000. It's fixed for v1 and applies to every quiz.
- A quiz is identified by its module title, as the quiz picker shows it today. If a module is renamed, attempts made under the old name are treated as a different quiz.
- Attempts are kept for as long as the account exists. There's no separate retention limit.
- Score % is rounded to a whole number, as the results screen does today. Duration is shown as minutes and seconds.
- Guests keep today's behavior: their sessions stay on the device and migrate on sign-in through the existing flow. This feature adds no guest-facing history.
- The existing sign-in flow and owner-only access rules on the learner's data (features 001 and 003) are reused.
- The `/progress` dashboard (feature 007) is unchanged apart from a link to History.

## Out of Scope

- Reviewing the individual questions and answers of a past attempt.
- Retrying only the questions missed in an attempt.
- Score-trend charts or improvement-over-time visuals.
- History for code-review, daily-review or flashcard sessions.
- History for guests.
- Deleting or editing individual attempts.

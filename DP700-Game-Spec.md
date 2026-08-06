# DP-700 Learning Game — Product Specification

**Version**: 2.0  
**Date**: 2026-08-06  
**Status**: Reflects shipped behaviour

> Section numbers are load-bearing. `frontend/src/lib/spacing.ts` cites §9,
> the constitution cites §8 and §13, and the feature specs under `specs/`
> cite §6, §7, and §10.2. Renumber only with a matching sweep.

---

## 1. Overview

### 1.1 Product Summary

A mobile-first, gamified web application for preparing for the **Microsoft
Certified: Fabric Data Engineer Associate** certification (Exam DP-700). A
curated question bank drives two study modes — multiple-choice quizzes and
code-review drills over real PySpark, T-SQL, and KQL — plus a spaced-repetition
Daily Review that pulls whatever is due today.

### 1.2 Goals

- Make DP-700 exam prep engaging, bite-sized, and habit-forming
- Cover all three official DP-700 exam domains with structured progression
- Track learner progress and surface weak areas intelligently
- Drill the three languages the exam names explicitly: SQL, PySpark, KQL

### 1.3 Non-Goals (v1)

- No social/multiplayer features
- No video content
- No native mobile app (PWA is the delivery vehicle)
- No runtime AI. The production app makes no outbound calls to any AI
  provider; see §7.

Offline support was a v1 non-goal in the 1.0 draft and is now **shipped** —
the PWA precaches the app shell and question bank, so a session can be
completed without a connection (§13, Phase 4).

---

## 2. Target Users

| Persona | Description |
|---|---|
| **The Career Switcher** | Moving into data-engineering roles, studying part-time |
| **The Data Professional** | Already works with Spark/SQL, learning the Fabric surface |
| **The Student** | University or bootcamp learner, exam in 4–8 weeks |

All personas share: **mobile-first usage**, **short study sessions (5–15 min)**, **need for immediate feedback**.

---

## 3. Tech Stack

### 3.1 Frontend

| Layer | Technology | Rationale |
|---|---|---|
| Framework | React 18 + Vite 5 | Fast builds, large ecosystem, easy deployment |
| Styling | Tailwind CSS 3 | Mobile-first utilities, consistent design system |
| Components | Hand-rolled | No component library; the surface is small enough that a dependency would cost more than it saves |
| Routing | React Router 6 | SPA navigation between game modes |
| State | Zustand 4 | Lightweight global state (session, progress), persisted to localStorage |
| Animations | Framer Motion 11 | Transitions and score reveals; disabled under `prefers-reduced-motion` |
| Syntax highlighting | Shiki 4 | Real grammars for `python`, `sql`, `kql`, `json` — code-review snippets are highlighted, not plain text |
| PWA | vite-plugin-pwa (Workbox) | Precached shell + offline sessions |

### 3.2 Backend / API

| Layer | Technology | Rationale |
|---|---|---|
| Database | Supabase (Postgres) | Question bank, user progress, subscriptions |
| Auth | Supabase Auth | Email magic link |
| Edge Functions | Supabase Functions (Deno) | Stripe checkout, billing portal, webhook |

There is no bespoke API tier. The client talks to PostgREST directly, and
row-level security is the authorization boundary.

### 3.2.1 Content Authoring Tooling (Offline, Not Runtime)

| Layer | Technology | Rationale |
|---|---|---|
| Markdown importer | `tools/import/md-quiz.ts` | Converts practice-quiz markdown in `bank/knowledge/` into seed JSON. The primary content path. |
| Authoring AI | Anthropic Claude (developer-side) | Drafts and expands bank entries during content production |
| Authoring scripts | Local Node scripts under `tools/` | Generate JSON, validate schemas, seed Supabase |

The production runtime makes **no** outbound calls to any AI provider. Claude
is used by the maintainer to author content offline; the resulting JSON is
reviewed by a human and committed to the seed bank before reaching users.

### 3.3 Hosting & DevOps

| Concern | Choice |
|---|---|
| Hosting | Vercel (`vercel.json`: builds in `frontend/`, publishes `frontend/dist`) |
| CI/CD | GitHub Actions — `data-layer.yml` (schema + seed) and `lighthouse.yml` (perf/a11y gate) |
| Environment | `frontend/.env.local` and `tools/.env.local` locally; Vercel env vars in production |
| Monitoring | Supabase logs |

---

## 4. Information Architecture

```
/                        → Home / Dashboard
/learn                   → Mode selector
/learn/quiz              → MCQ quiz session
/learn/code-review       → Code review drill
/learn/daily-review      → Spaced-repetition queue (dispatches across modes)
/progress                → Stats, streaks, weak areas
/settings                → Account, preferences
/settings/billing        → Plan view, upgrade / manage
/whats-in-pro            → Pro tier explainer
/sign-in, /auth/callback → Magic-link auth
/legal/privacy, /legal/terms
/admin                   → Question editor (admin-gated)
```

---

## 5. Game Structure

### 5.1 Level System

Levels are XP thresholds, not content gates — every question is available
from the first session.

| Level | Name | XP required |
|---|---|---|
| 1 | **Foundation** | 0 |
| 2 | **Practitioner** | 500 |
| 3 | **Engineer** | 2,000 |
| 4 | **Expert** | 5,000 |

Thresholds are enforced by `levelFromXp`. The names are a spec-level concept
only — the UI renders the numeric level, so renaming a tier costs nothing.

### 5.2 DP-700 Exam Domains

Per the study guide refreshed **21 July 2026**. Slugs are the canonical
identifiers used in the type system, the `questions_domain_chk` constraint,
and every content file.

| Domain | Slug | Weight | Representative topics |
|---|---|---|---|
| Implement and manage an analytics solution | `implement-manage` | 30–35% | Workspace settings, lifecycle management, security and governance, orchestration |
| Ingest and transform data | `ingest-transform` | 30–35% | Loading patterns, Dataflows Gen2, pipelines, shortcuts, mirroring, Eventstreams, windowing |
| Monitor and optimize an analytics solution | `monitor-optimize` | 30–35% | Monitoring hub, alerts, error resolution, Lakehouse/warehouse/Spark optimization |

The full topic lists live in `exams.config.json`, which is the single source
of truth for taxonomy.

---

## 6. Game Modes

### 6.1 Multiple Choice Quiz (MCQ)

**Purpose**: Simulate exam conditions, test applied knowledge.

**Flow**:

1. User selects domain, difficulty, and question count (5 / 10 / 20)
2. Optional: enable timer (45 seconds per question, exam pace)
3. Question displayed with its options
4. On answer:
   - **Correct**: green highlight + explanation
   - **Incorrect**: red on chosen, green on correct + explanation
5. "Next" → advances
6. End screen: score %, time taken, per-domain breakdown, weak domains flagged

**Option count is variable.** Most items carry four options (A–D). Items
derived from true/false source questions carry exactly two (A = True,
B = False). The renderer draws whichever letters the item actually has;
nothing may assume four.

**Question Data Fields**:
```json
{
  "id": "uuid",
  "type": "mcq",
  "domain": "ingest-transform",
  "topic": "Dataflows Gen2 vs Notebooks vs KQL vs T-SQL",
  "difficulty": 1,
  "source": "bank",
  "tags": ["ingest-transform", "dataflows-gen2", "level-1"],
  "content": {
    "question": "What type of tool is a Dataflow Gen2 fundamentally classified as?",
    "options": { "A": "A reporting tool", "B": "A cloud-based ETL tool", "C": "A row-level security engine", "D": "A streaming engine" },
    "correct": "B",
    "explanation": "Dataflows are cloud-based ETL tools for building scalable transformation processes..."
  }
}
```

**UX Notes**:

- Timer shown as a shrinking ring around the question number
- Keyboard shortcuts on desktop: A/B/C/D
- Results screen shows domain breakdown and a "review missed" CTA

### 6.2 Code Review

**Purpose**: Drill the three languages DP-700 names explicitly — SQL,
PySpark, and KQL — plus pipeline/Dataflow JSON.

**Sub-modes**:

| Sub-mode | Task |
|---|---|
| `find-the-bug` | One deliberate flaw in an 8–20 line snippet; identify it |
| `what-does-this-do` | Read the snippet, pick the accurate description |
| `fill-the-blank` | Exactly one `___BLANK___`; pick the only valid completion |

**Languages**: `python` (PySpark), `sql` (T-SQL), `kql`, `json` (pipeline and
Dataflow definitions). Snippets are highlighted with real Shiki grammars.

**Data Fields**:
```json
{
  "id": "uuid",
  "type": "code-review",
  "domain": "monitor-optimize",
  "topic": "Spark Performance",
  "difficulty": 3,
  "content": {
    "sub_mode": "find-the-bug",
    "language": "python",
    "snippet": "df = spark.read.format(\"delta\").load(path)\nfor c in cols:\n    print(df.count())\n...",
    "prompt": "Identify the performance flaw in this notebook cell.",
    "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
    "correct": "A",
    "explanation": "count() on an uncached dataframe recomputes the whole lineage each iteration..."
  }
}
```

Authoring guidance, including a catalogue of real Fabric traps, lives in
`tools/author/prompts/code-review.md`.

### 6.3 Daily Review

Pulls every item whose `next_review` has come due and dispatches each to its
native mode UI in one session. Capped at `DAILY_REVIEW_CAP` (30) items; an
"extend" action pulls the next batch of the same size. Only the first,
non-extended batch earns the streak bump and the +20 XP bonus, so extending
is unlimited practice without inflating either number.

### 6.4 Retired and never-built modes

Recorded so the history stays legible:

- **Flashcards** — shipped (spec 004), removed 2026-08-06. The DP-700 bank is
  built from practice-quiz markdown whose true/false section now imports as a
  two-option MCQ, leaving no producer of flashcard items. Migration
  `0015_drop_flashcards.sql` dropped the type. In the 1.0 draft this mode
  occupied §6.1.

- **Product Identification** — specified in the 1.0 draft at §6.3, never
  built. Replaced by Code Review (spec 006): DP-700 has thin product-breadth
  but heavy code content, which inverts the rationale. The `product-id` type
  never existed in the database.

---

## 7. AI-Assisted Content Authoring (Offline)

Claude is used **by the maintainer**, not by end users. The production app
never calls an AI API.

### 7.1 Content paths

| Path | Use |
|---|---|
| **Markdown import** (primary) | Author a practice quiz as markdown in `bank/knowledge/`, run `pnpm -C tools import:md`. Sections A and C become MCQs, Section B becomes two-option true/false MCQs. IDs are UUIDv5 over `<file>#<number>`, so re-import is idempotent. |
| **Claude drafting** | `pnpm -C tools author draft` for topics the markdown doesn't cover — especially code-review items, which the quiz format does not produce. |

### 7.2 Authoring Workflow

1. Maintainer runs a local Node script under `tools/author/` that prompts
   Claude with domain, topic, difficulty, existing item IDs to avoid, and the
   JSON schema.

2. Claude returns JSON; the script validates against the schema in §8.
3. Maintainer reviews each item, edits as needed, and commits the reviewed
   JSON to the seed file.

4. `pnpm -C tools seed` writes items into Supabase with `source:
   "ai-generated"` and the human reviewer's initials.

### 7.3 Prompt Design Principles

- Always include: domain, topic, difficulty level, exam context ("DP-700")
- For generation: include existing item IDs to suppress duplicates
- Temperature: `0.7` for generation, `0.3` for explanation rewrites
- Always request JSON output for generation

---

## 8. Data Model (Supabase)

Fifteen migrations under `supabase/migrations/`. Abridged shape:

```sql

-- Question bank (public read; admin-only write)
questions (
  id uuid PRIMARY KEY,
  type text,           -- 'mcq' | 'code-review'
  domain text,         -- 'implement-manage' | 'ingest-transform' | 'monitor-optimize'
  topic text,
  difficulty int,      -- 1 (easy) to 3 (hard)
  source text,         -- 'bank' | 'ai-generated'
  reviewer_id text,    -- required when source = 'ai-generated'
  reviewed_at timestamptz,
  content jsonb,       -- shape enforced per type by CHECK
  content_hash text,
  created_at timestamptz
)

profiles (              -- extends auth.users, auto-created by trigger
  id uuid PRIMARY KEY REFERENCES auth.users,
  display_name text, streak_days int, last_active date, level int
)

user_progress (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles ON DELETE CASCADE,
  question_id uuid REFERENCES questions ON DELETE CASCADE,
  times_seen int, times_correct int,
  last_rating text,    -- 'correct' | 'almost' | 'missed'
  next_review date,    -- spaced repetition
  UNIQUE (user_id, question_id)
)

sessions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles ON DELETE CASCADE,
  mode text,           -- 'mcq' | 'code-review' | 'daily-review'
  topic text, score_pct float, duration_seconds int, completed_at timestamptz
)

subscriptions (...)     -- Stripe plan state
admins (...)            -- gates /admin and question writes
webhook_events (...)    -- Stripe webhook idempotency
```

Every user-scoped table is protected by RLS keyed on `auth.uid()`. The
`questions` table is world-readable so guests can study without an account.

`last_rating` still admits `'almost'`, but no UI produces it since flashcard
self-rating was removed (§6.4). The column and the §9 branch are retained
rather than migrated away.

---

## 9. Spaced Repetition Logic

Simplified **SM-2**, implemented in `frontend/src/lib/spacing.ts`:

| Rating | Next Review |
|---|---|
| Correct | `3 × 2^(prior correct answers)` days — 3, 6, 12, 24… |
| Almost | Tomorrow (unreachable today, see §8) |
| Missed | Tomorrow; the interval streak resets |

- Items due for review surface first in any session
- "Daily Review" on the home screen shows what is due today

---

## 10. UX & Design

### 10.1 Design Principles

- **Mobile-first**: layouts designed for 375px width first, scaled up
- **Thumb-friendly**: primary actions in the bottom 60% of the screen
- **Dark mode default**: dark background, accent-forward
- **Progress visible always**: streak, XP, and session progress in view

### 10.2 Key Screens

| Screen | Key Elements |
|---|---|
| **Home / Dashboard** | Daily streak, XP bar, Daily Review hero, quick-start CTAs, bank size |
| **Mode Selector** | Two mode cards (Quiz / Code Review) with live available-item counts |
| **Quiz Session** | Question + tappable options, optional timer ring, explanation panel |
| **Code Review Session** | Highlighted snippet, prompt, four options, explanation |
| **Results Screen** | Score, domain breakdown, XP earned, "Review Missed" CTA |
| **Progress Dashboard** | Three-axis domain radar, streak calendar, focus areas |
| **Admin** | Question CRUD with live schema validation |

### 10.3 Mobile Gestures

| Gesture | Action |
|---|---|
| Tap option | Select answer |
| Swipe up | Next question (after answering) |

Keyboard equivalents exist for every gesture.

---

## 11. Gamification

| Element | Description |
|---|---|
| **XP Points** | `10 × correct + 50` per completed session; the first (non-extended) Daily Review batch adds `+20` |
| **Daily Streak** | Days in a row with at least one session |
| **Level Badges** | Foundation → Practitioner → Engineer → Expert (§5.1) |
| **Domain Mastery** | Per-domain accuracy on the progress radar |

---

## 12. Question Bank Seed Plan

Target is **200 items**, weighted evenly across the three domains to match the
exam's even domain weighting (`exams.config.json` → `questionTargets`).

Current bank — 86 items, all MCQ, generated from five Microsoft Learn module
quizzes in `bank/knowledge/`:

| Domain | MCQ | Code Review | Total |
|---|---|---|---|
| `implement-manage` | 52 | 0 | 52 |
| `ingest-transform` | 34 | 0 | 34 |
| `monitor-optimize` | 0 | 0 | 0 |
| **Total** | **86** | **0** | **86** |

Known gaps, in priority order:

1. **`monitor-optimize` has no items.** No source module covers it yet.
2. **Code Review has no items.** The quiz markdown contains no code snippets;
   these must be authored via `tools/author` (§7).

3. **Answer-letter distribution is skewed** — B is correct in roughly half the
   bank, inherited from the source material. Correcting it means shuffling
   options *and* rewriting the letter references inside explanations, which
   cannot be done safely by pattern matching.

Content sourced from the official Microsoft Learn DP-700 study guide and
module content, paraphrased rather than copied.

---

## 13. Development Phases

Phases 1–4 are delivered. Feature-level specs live under `specs/`.

### Phase 1 — Foundation ✅

- [x] Supabase schema + seed (spec 001)
- [x] React app scaffold with routing (spec 002)
- [x] ~~Flashcard mode~~ (spec 004 — shipped, later removed; §6.4)
- [x] MCQ mode (spec 005)
- [x] Supabase Auth + guest migration (spec 003)

### Phase 2 — Core Game ✅

- [x] Code Review mode (spec 006) — replaced Product ID
- [x] Timer for MCQ
- [x] Results screen with domain breakdown
- [x] User progress tracking, streak + XP

### Phase 3 — Content & Personalization ✅

- [x] Authoring scripts under `tools/author/` (spec 009)
- [x] Spaced repetition / Daily Review (spec 008)
- [x] Progress dashboard with radar (spec 007)
- [x] Admin question editor (spec 013)

### Phase 4 — Polish & Launch ✅

- [x] Dark mode + themes (spec 010)
- [x] PWA manifest + offline shell + install prompt (spec 010)
- [x] Pro tier + Stripe plumbing (spec 011)
- [x] Lighthouse gate ≥ 90 (spec 012)

### Phase 5 — DP-700 content (current)

- [ ] Fill `monitor-optimize`
- [ ] Author code-review items across PySpark / T-SQL / KQL
- [ ] Grow the bank toward the 200-item target
- [ ] Resolve the answer-letter skew

---

## 14. Success Metrics

| Metric | Target (3 months post-launch) |
|---|---|
| Daily Active Users | 500+ |
| Avg session length | 8–12 minutes |
| D7 retention | 30%+ |
| Quiz completion rate | 75%+ |
| User-reported exam pass rate | Track via optional survey |

---

## 15. Resolved Decisions

1. **Auth model**: **Guest mode with local storage.** Anyone can start
   immediately; progress lives in localStorage under the `dp700game.*`
   namespace. Optional magic-link sign-in migrates local progress into the
   profile at a session boundary.

2. **Pricing**: **Free + paid "Pro" cosmetic tier.** Free includes the full
   question bank and every study mode. Pro unlocks extra themes, advanced
   stats, and the exam-day countdown — non-essential features only. No paid
   feature blocks exam preparation.

3. **Azure icons**: **Moot.** The licensing question existed only for Product
   Identification mode, which was never built (§6.4). No Microsoft icon assets
   ship with the app.

4. **Localization**: **English only for v1.** No i18n framework; strings are
   inline.

5. **Accessibility**: **WCAG 2.1 AA on core flows.** "Core" = quiz,
   code review, daily review, sign-in, and guest-to-account migration.
   Settings, progress dashboard, and admin screens are best-effort. Keyboard
   equivalents for every gesture are mandatory app-wide. Lighthouse
   Accessibility ≥ 90 is the numerical gate.

6. **True/false items**: **Two-option MCQs, not a separate type.** The `mcq`
   schema requires only options A and B, so a true/false question needs no
   invented distractors and no new question type.

---

*Spec 1.0 authored with Claude (Anthropic) before development kickoff. 2.0
rewritten 2026-08-06 to describe what actually shipped.*

# DP-700 · Authoring Prompt Addendum — Code Review Items

Append this section to `dp700-question-authoring-prompt.md` (the base authoring prompt).

---

## Additional schema: code-review

```
### code-review
{
  "id": "<generate a new UUIDv4>",
  "type": "code-review",
  "domain": "<domain slug>",
  "topic": "<topic string from allowed list>",
  "difficulty": <1 | 2 | 3>,
  "tags": ["<domain slug>", "<topic-slug>", "level-<difficulty>", "<sub_mode>"],
  "source": "ai-generated",
  "content": {
    "sub_mode": "<find-the-bug | what-does-this-do | fill-the-blank>",
    "language": "<python | sql | kql | json>",
    "snippet": "<the code block — 8 to 20 lines — escaped as a JSON string>",
    "prompt": "<one sentence — what the learner must do — ≤ 200 chars>",
    "options": {
      "A": "<option text — ≤ 240 chars>",
      "B": "<option text — ≤ 240 chars>",
      "C": "<option text — ≤ 240 chars>",
      "D": "<option text — ≤ 240 chars>"
    },
    "correct": "<A | B | C | D>",
    "explanation": "<why correct is right AND why top distractor is wrong — 2–4 sentences, no markdown>"
  }
}
```

`language` maps to the three languages DP-700 names explicitly, plus JSON for
pipeline and Dataflow definitions:

| Value    | Use for                                                        |
| -------- | -------------------------------------------------------------- |
| `python` | PySpark in a Fabric notebook                                     |
| `sql`    | T-SQL in a Warehouse or SQL analytics endpoint                   |
| `kql`    | KQL against an Eventhouse / KQL database                         |
| `json`   | Pipeline activity definitions, Dataflow Gen2 config, deployment  |

---

## Code-review quality rules (in addition to the shared rules)

1. **One flaw only** (`find-the-bug`): introduce exactly one deliberate error.
   Do not hide two bugs — the learner should be able to reason to one
   correct answer unambiguously.

2. **One blank only** (`fill-the-blank`): use exactly one `___BLANK___`
   placeholder. Multi-blank snippets are out of scope for v1.

3. **Realistic snippets**: snippets must look like code a learner would
   actually write in a Fabric notebook, a Warehouse query window, a KQL
   queryset, or a pipeline JSON definition. Avoid toy examples.

4. **Plausible distractors**: all four options must be things a learner
   who partially understands the topic would consider. Avoid options that
   are obviously nonsensical.

5. **Snippet length**: 8–20 lines. Long enough to be realistic;
   short enough to read in under 30 seconds on mobile.

6. **No markdown in explanation**: plain sentences only. No code fences,
   no bold, no bullet points inside the explanation field.

7. **Escape correctly**: the `snippet` field is a JSON string. Use `\n`
   for newlines and `\"` for any double-quotes inside the snippet.

8. **Difficulty calibration for code-review**:
   - **Level 1**: obvious flaw or simple recall ("what does `OPTIMIZE` do
     to a Delta table?")
   - **Level 2**: requires knowing which option fits a scenario
     (e.g. when `has` beats `contains`, managed vs external table writes)
   - **Level 3**: exam trap — the snippet looks correct but violates a
     non-obvious constraint (e.g. KQL `join` defaulting to `innerunique`,
     a Warehouse primary key being `NOT ENFORCED`)

---

## High-value code-review scenarios (ready to author)

Use these as starting points for `find-the-bug` and `fill-the-blank` items.
Each maps to a real exam trap. Verify behaviour against current Fabric docs
before shipping — the platform moves quickly.

### PySpark and Delta (ingest-transform)

- `spark.read.format("csv").option("header", "true").load(...)` with no
  `inferSchema` or explicit schema — every column silently lands as string
- `df.write.format("delta").save(path)` where a managed table was intended —
  `saveAsTable` registers it in the metastore, `save` leaves it external
- Schema evolution write without `.option("mergeSchema", "true")` — fails
  when a new column appears
- `partitionBy` on a high-cardinality column such as an order ID — produces
  the small-file problem rather than helping
- `createOrReplaceTempView` expected to survive into the next session —
  temp views are session-scoped

### Spark performance (monitor-optimize)

- `df.count()` called repeatedly inside a loop on an uncached dataframe —
  the whole lineage recomputes each time; needs `.cache()` and an action
- `collect()` on a full dataframe to "check the data" — pulls everything to
  the driver; use `limit()` then `show()`
- A Delta table written by many small appends with no `OPTIMIZE` — read
  performance degrades until the files are compacted
- `VACUUM` with a retention below the default without
  `spark.databricks.delta.retentionDurationCheck.enabled` set — breaks
  time travel

### KQL and Eventhouse (ingest-transform / monitor-optimize)

- `join` written without a `kind`, expecting SQL semantics — KQL defaults to
  `innerunique`, which de-duplicates the left side. The classic trap.
- `contains` used on an indexed string column where `has` is correct —
  `has` matches whole terms and uses the index; `contains` scans substrings
- `| where` placed after `| summarize` — filters the aggregate instead of
  the source rows, doing far more work than needed
- `bin()` omitted from a time-series `summarize`, so no windowing occurs
- A materialized view defined over a non-deterministic aggregation — must
  use `arg_max`, `take_any`, or another supported aggregation

### Warehouse T-SQL (implement-manage / monitor-optimize)

- `PRIMARY KEY` declared without `NONCLUSTERED NOT ENFORCED` — Fabric
  Warehouse only supports unenforced constraints, and duplicate rows will
  still load
- `SELECT TOP 10` with no `ORDER BY`, expected to be deterministic
- `SELECT ... INTO` used to create a table — use `CREATE TABLE AS SELECT`
- A cross-warehouse query written with two-part naming — needs three-part
  `database.schema.table`
- A row-level security predicate function missing `WITH SCHEMABINDING`
- Dynamic data masking applied while the querying principal holds `UNMASK`,
  so the data comes back in the clear

### Pipelines and Dataflows (implement-manage / monitor-optimize)

- An activity dependency set to `Succeeded` where the intent was a
  failure-handling branch — that branch never runs; use `Failed`
- Dynamic content written as `@pipeline().parameters.p` inside a larger
  string without the `@{...}` interpolation form
- A Copy activity referencing `@activity('Prev').output.value` when the
  previous activity is a Copy, which does not expose `value`
- No retry or timeout configured on a flaky external source

---

## This authoring run (code-review)

```
Domain    : <domain slug>
Topic(s)  : <topic strings from allowed list>
Sub-mode  : <find-the-bug | what-does-this-do | fill-the-blank>
Language  : <python | sql | kql | json>
Difficulty: <1 | 2 | 3>
Count     : <N items>

Existing item IDs to avoid:
< paste UUIDs >

Knowledge-bank files to use as source:
< paste relevant .md file contents >
```

---

## Maintainer checklist — code-review items

Before committing, verify:

- [ ] Snippet is realistic (looks like real PySpark / T-SQL / KQL / pipeline JSON)
- [ ] `find-the-bug`: exactly one flaw, unambiguously identified by the correct option
- [ ] `fill-the-blank`: exactly one `___BLANK___`, correct option is the only valid completion
- [ ] All four options are plausible to a learner who partially knows the topic
- [ ] Explanation names the flaw, explains why it matters, and names the correct fix
- [ ] Snippet is 8–20 lines
- [ ] `\n` used for newlines in the JSON string (not literal newlines)
- [ ] No markdown in `explanation` field
- [ ] Difficulty level matches the calibration guide above
- [ ] `language` field matches the actual snippet content
- [ ] Tags include the `sub_mode` value (e.g. `"find-the-bug"`)

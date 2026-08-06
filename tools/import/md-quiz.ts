/**
 * Import practice-quiz markdown from bank/knowledge/ into the seed bank.
 *
 * Source format (one file per Microsoft Learn module):
 *
 *   # DP-700 Practice Quiz — <module title>
 *   Source module: <learn.microsoft.com URL>
 *   DP-700 domains: **<Domain>** (hint) | **<Domain>** (hint)
 *
 *   ## Section A — Multiple Choice
 *   **1.** <question>
 *   A. <option>  B. <option>  C. <option>  D. <option>
 *
 *   ## Section B — True / False
 *   **11.** <statement> **(True/False)**
 *
 *   ## Section C — Scenario / Choose the Best Option
 *   (same shape as Section A)
 *
 *   ## Answer Key & Rationale
 *   **1. B — <restated answer>.** <rationale>
 *   **15. C.** <rationale>                  ← letter only
 *   **11. False.** <rationale>              ← true/false
 *
 * Every section becomes an `mcq` item. Section B's true/false statements use
 * a two-option MCQ (A = True, B = False) — the mcq schema requires only A and
 * B, so no filler distractors have to be invented.
 *
 * IDs are UUIDv5 over "<file stem>#<question number>", so re-running the
 * import is idempotent — the same question keeps the same id and the seed
 * CLI's cross-bank duplicate check stays happy.
 *
 * Usage:
 *   pnpm -C tools import:md               # write the seed file
 *   pnpm -C tools import:md -- --dry-run  # report only, write nothing
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOLS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = resolve(TOOLS_DIR, '..');
const KNOWLEDGE_DIR = resolve(REPO_ROOT, 'bank', 'knowledge');
const CONTENT_DIR = resolve(REPO_ROOT, 'supabase', 'seed', 'content');

type Domain = 'implement-manage' | 'ingest-transform' | 'monitor-optimize';

/** Prose domain names as written in the quiz headers, longest-first. */
const DOMAIN_PROSE: ReadonlyArray<[RegExp, Domain]> = [
  [/implement and manage/i, 'implement-manage'],
  [/ingest and transform/i, 'ingest-transform'],
  [/monitor and optimi[sz]e/i, 'monitor-optimize'],
];

/**
 * Topic per source file. Values must appear in the matching domain's `topics`
 * array in exams.config.json. Falls back to the module title when unmapped.
 */
const TOPIC_BY_FILE: Record<string, string> = {
  '1-DP-700_Dataflows-Gen2_Quiz': 'Dataflows Gen2 vs Notebooks vs KQL vs T-SQL',
  '2-DP-700_Orchestrate-Pipelines_Quiz': 'Orchestration Patterns',
  '3-DP-700_Apache-Spark_Quiz': 'PySpark Transforms',
  '4-DP-700_Eventhouse-KQL_Quiz': 'KQL Transforms',
  '5-DP-700_Intro-End-to-End-Analytics_Quiz': 'OneLake Workspace Settings',
};

/** Section A recalls facts, Section C reasons about a scenario. */
const DIFFICULTY_BY_SECTION: Record<Section, 1 | 2 | 3> = { A: 1, B: 1, C: 2 };

const LIMITS = {
  mcqQuestion: 600,
  mcqOption: 240,
  explanation: 1200,
} as const;

type Section = 'A' | 'B' | 'C';

interface ParsedQuestion {
  number: number;
  section: Section;
  prompt: string;
  options?: Record<'A' | 'B' | 'C' | 'D', string>;
}

interface ParsedAnswer {
  number: number;
  /** 'A'–'D' for multiple choice, 'True'/'False' for section B. */
  verdict: string;
  explanation: string;
}

interface BankItem {
  id: string;
  type: 'mcq';
  domain: Domain;
  topic: string;
  difficulty: 1 | 2 | 3;
  source: 'bank';
  tags: string[];
  content: Record<string, unknown>;
}

const warnings: string[] = [];
const warn = (msg: string): void => {
  warnings.push(msg);
};

/** RFC 4122 §4.3 name-based UUIDv5 (SHA-1), so ids are stable across runs. */
function uuidv5(name: string, namespace: string): string {
  const nsBytes = Buffer.from(namespace.replace(/-/g, ''), 'hex');
  const hash = createHash('sha1').update(nsBytes).update(Buffer.from(name, 'utf8')).digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // RFC 4122 variant
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Fixed namespace for this bank — arbitrary but must never change. */
const NS = '6f9619ff-8b86-d011-b42d-00c04fc964ff';

/** Strip the markdown the schemas forbid, leaving readable plain text. */
function plain(md: string): string {
  return md
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function capped(value: string, limit: number, label: string): string {
  if (value.length <= limit) return value;
  warn(`${label}: ${value.length} chars exceeds ${limit}; truncated at a word boundary`);
  const cut = value.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function parseDomain(body: string, file: string): Domain {
  const line = body.match(/^DP-700 domains?:.*$/m)?.[0];
  if (!line) {
    warn(`${file}: no "DP-700 domain(s):" header line; defaulted to ingest-transform`);
    return 'ingest-transform';
  }
  // Headers may list several domains; the first is the module's primary one.
  const first = line.match(/\*\*(.+?)\*\*/)?.[1] ?? line;
  for (const [re, domain] of DOMAIN_PROSE) if (re.test(first)) return domain;
  warn(`${file}: unrecognised domain "${plain(first)}"; defaulted to ingest-transform`);
  return 'ingest-transform';
}

function parseQuestions(body: string, file: string): ParsedQuestion[] {
  const out: ParsedQuestion[] = [];
  const sectionRe = /^## Section ([ABC])\b.*$/gm;
  const marks = [...body.matchAll(sectionRe)];

  for (const [i, mark] of marks.entries()) {
    const section = mark[1] as Section;
    const start = mark.index! + mark[0].length;
    const end = i + 1 < marks.length ? marks[i + 1]!.index! : (body.match(/^## Answer Key/m)?.index ?? body.length);
    const chunk = body.slice(start, end);

    // A question runs from its "**N.**" marker to the next one (or chunk end).
    // `$(?![\s\S])` is end-of-input; plain `$` would match every line end
    // under /m, and JS has no \Z.
    const qRe = /^\*\*(\d+)\.\*\*\s*([\s\S]*?)(?=^\*\*\d+\.\*\*|$(?![\s\S]))/gm;
    for (const m of chunk.matchAll(qRe)) {
      const number = Number(m[1]);
      const raw = m[2]!.trim();
      if (section === 'B') {
        out.push({ number, section, prompt: plain(raw.replace(/\*\*\(True\/False\)\*\*/i, '')) });
        continue;
      }
      const optRe = /^([A-D])\.\s+(.+)$/gm;
      const options = {} as Record<'A' | 'B' | 'C' | 'D', string>;
      let promptEnd = raw.length;
      for (const o of raw.matchAll(optRe)) {
        if (o.index! < promptEnd) promptEnd = o.index!;
        options[o[1] as 'A'] = plain(o[2]!);
      }
      const missing = (['A', 'B', 'C', 'D'] as const).filter((k) => !options[k]);
      if (missing.length > 0) {
        warn(`${file} Q${number}: missing option(s) ${missing.join(', ')}; skipped`);
        continue;
      }
      out.push({ number, section, prompt: plain(raw.slice(0, promptEnd)), options });
    }
  }
  return out;
}

function parseAnswers(body: string, file: string): Map<number, ParsedAnswer> {
  const map = new Map<number, ParsedAnswer>();
  const keyStart = body.match(/^## Answer Key.*$/m);
  if (!keyStart) {
    warn(`${file}: no "## Answer Key" section; every question in this file is unanswerable`);
    return map;
  }
  const chunk = body.slice(keyStart.index! + keyStart[0].length);

  // Three observed shapes:
  //   **1. B — restated answer.** rationale
  //   **15. C.** rationale
  //   **11. False.** rationale
  const re =
    /^\*\*(\d+)\.\s*(?:([A-D])(?:\s*[—–-]\s*[^*]*?)?|(True|False))\.?\*\*\s*([\s\S]*?)(?=^\*\*\d+\.|^---|$(?![\s\S]))/gm;
  for (const m of chunk.matchAll(re)) {
    const number = Number(m[1]);
    const verdict = (m[2] ?? m[3])!;
    map.set(number, { number, verdict, explanation: plain(m[4] ?? '') });
  }
  return map;
}

function buildItems(file: string, body: string): BankItem[] {
  const stem = file.replace(/\.md$/, '');
  const domain = parseDomain(body, file);
  const moduleTitle = plain(body.match(/^#\s+(.+)$/m)?.[1] ?? stem).replace(/^DP-700 Practice Quiz\s*[—–-]\s*/, '');
  const topic = TOPIC_BY_FILE[stem] ?? moduleTitle;
  const sourceUrl = body.match(/^Source module:\s*(\S+)/m)?.[1];

  const questions = parseQuestions(body, file);
  const answers = parseAnswers(body, file);
  const items: BankItem[] = [];

  for (const q of questions) {
    const a = answers.get(q.number);
    if (!a) {
      warn(`${file} Q${q.number}: no answer-key entry; skipped`);
      continue;
    }
    const difficulty = DIFFICULTY_BY_SECTION[q.section];
    const id = uuidv5(`${stem}#${q.number}`, NS);
    const tags = [domain, slugify(topic), `level-${difficulty}`, slugify(stem)];
    // Rationales reference the source module; keep that provenance in the text.
    const explanation = capped(
      sourceUrl ? `${a.explanation} (Source: ${sourceUrl})` : a.explanation,
      LIMITS.explanation,
      `${file} Q${q.number} explanation`,
    );

    if (q.section === 'B') {
      if (a.verdict !== 'True' && a.verdict !== 'False') {
        warn(`${file} Q${q.number}: section B answer is "${a.verdict}", expected True/False; skipped`);
        continue;
      }
      items.push({
        id,
        type: 'mcq',
        domain,
        topic,
        difficulty,
        source: 'bank',
        tags,
        content: {
          question: capped(`True or false? ${q.prompt}`, LIMITS.mcqQuestion, `${file} Q${q.number} question`),
          options: { A: 'True', B: 'False' },
          correct: a.verdict === 'True' ? 'A' : 'B',
          explanation,
        },
      });
      continue;
    }

    if (!/^[A-D]$/.test(a.verdict)) {
      warn(`${file} Q${q.number}: answer "${a.verdict}" is not A–D; skipped`);
      continue;
    }
    const options = Object.fromEntries(
      (['A', 'B', 'C', 'D'] as const).map((k) => [
        k,
        capped(q.options![k], LIMITS.mcqOption, `${file} Q${q.number} option ${k}`),
      ]),
    ) as Record<'A' | 'B' | 'C' | 'D', string>;

    items.push({
      id,
      type: 'mcq',
      domain,
      topic,
      difficulty,
      source: 'bank',
      tags,
      content: {
        question: capped(q.prompt, LIMITS.mcqQuestion, `${file} Q${q.number} question`),
        options,
        correct: a.verdict,
        explanation,
      },
    });
  }
  return items;
}

function main(): void {
  const dryRun = process.argv.includes('--dry-run');
  const files = readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith('.md') && f !== 'README.md').sort();
  if (files.length === 0) {
    console.error(`No .md files in ${KNOWLEDGE_DIR}`);
    process.exit(1);
  }

  const all: BankItem[] = [];
  for (const file of files) {
    const items = buildItems(file, readFileSync(resolve(KNOWLEDGE_DIR, file), 'utf8'));
    const trueFalse = items.filter((i) => Object.keys(i.content.options as object).length === 2).length;
    console.log(
      `${file.padEnd(46)} ${String(items.length).padStart(3)} items  ` +
        `(${items.length - trueFalse} four-option, ${trueFalse} true/false)  → ${items[0]?.domain ?? '—'}`,
    );
    all.push(...items);
  }

  const seen = new Set<string>();
  for (const item of all) {
    if (seen.has(item.id)) warn(`duplicate id ${item.id} — check for repeated question numbers`);
    seen.add(item.id);
  }

  const trueFalse = all.filter((i) => Object.keys(i.content.options as object).length === 2).length;
  console.log(
    `\nTotal: ${all.length} mcq — ${all.length - trueFalse} four-option, ${trueFalse} true/false, 0 code-review`,
  );
  const byDomain = new Map<string, number>();
  for (const i of all) byDomain.set(i.domain, (byDomain.get(i.domain) ?? 0) + 1);
  for (const [d, n] of [...byDomain].sort()) console.log(`  ${d.padEnd(18)} ${n}`);

  if (warnings.length > 0) {
    console.log(`\n${warnings.length} warning(s):`);
    for (const w of warnings) console.log(`  ! ${w}`);
  }

  if (dryRun) {
    console.log('\n--dry-run: no files written.');
    return;
  }
  writeFileSync(resolve(CONTENT_DIR, 'mcq.json'), `${JSON.stringify(all, null, 2)}\n`);
  console.log(`\nWrote ${all.length} → supabase/seed/content/mcq.json`);
  console.log('code-review.json left untouched (no code snippets in the source files).');
}

main();

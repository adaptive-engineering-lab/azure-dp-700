export type Domain =
  | 'implement-manage'
  | 'ingest-transform'
  | 'monitor-optimize';

export const DOMAINS: Domain[] = [
  'implement-manage',
  'ingest-transform',
  'monitor-optimize',
];

/**
 * The official domain names, verbatim from the DP-700 study guide
 * (skills measured as of 2026-07-21). Kept in Microsoft's sentence case so
 * this file can be diffed against the source when the exam is updated.
 * They are long by design — components wrap rather than abbreviate.
 */
export const DOMAIN_LABELS: Record<Domain, string> = {
  'implement-manage': 'Implement and manage an analytics solution',
  'ingest-transform': 'Ingest and transform data',
  'monitor-optimize': 'Monitor and optimize an analytics solution',
};

export type OptionLetter = 'A' | 'B' | 'C' | 'D';

/**
 * A and B are always present; C and D are optional so that two-way
 * true/false items can use the same shape as four-option questions.
 * Render whichever keys exist rather than assuming all four.
 */
export type McqOptions = { A: string; B: string; C?: string; D?: string };

export interface McqContent {
  question: string;
  options: McqOptions;
  correct: OptionLetter;
  explanation: string;
}

export type CodeReviewSubMode = 'find-the-bug' | 'what-does-this-do' | 'fill-the-blank';
export type CodeReviewLanguage = 'python' | 'sql' | 'kql' | 'json';

export interface CodeReviewContent {
  sub_mode: CodeReviewSubMode;
  language: CodeReviewLanguage;
  snippet: string;
  prompt: string;
  options: { A: string; B: string; C: string; D: string };
  correct: OptionLetter;
  explanation: string;
}

export interface BaseQuestion {
  id: string;
  type: 'mcq' | 'code-review';
  domain: Domain;
  /** The Microsoft Learn module the item was authored from. */
  topic: string;
  difficulty: 1 | 2 | 3;
  /**
   * Free-form labels written by the importer. Recognised prefixes:
   * `module:<slug>`, `path:<id>` (every path the module belongs to), and
   * `primary-path:<id>` (the one worth showing).
   */
  tags?: string[];
}

/**
 * Learning paths, mirroring exams.config.json → learningPaths. Kept here
 * because the frontend does not read the config at runtime; if you add a
 * path there, add it here too.
 */
export const LEARNING_PATHS: Record<string, string> = {
  lp1: 'Get started with Microsoft Fabric',
  lp2: 'Implement a Lakehouse with Microsoft Fabric',
  lp3: 'Ingest data with Microsoft Fabric',
  lp4: 'Implement Real-Time Intelligence with Microsoft Fabric',
};

/**
 * Id of the primary learning path for an item, if it declares one the
 * frontend knows a title for. An unrecognised id reads as no path rather than
 * as a path with a blank name.
 */
export function primaryLearningPathId(tags: string[] | undefined): string | null {
  const tag = tags?.find((t) => t.startsWith('primary-path:'));
  if (!tag) return null;
  const id = tag.slice('primary-path:'.length);
  return id in LEARNING_PATHS ? id : null;
}

/** Title of the primary learning path for an item, if it declares one. */
export function primaryLearningPath(tags: string[] | undefined): string | null {
  const id = primaryLearningPathId(tags);
  return id ? LEARNING_PATHS[id]! : null;
}

export interface McqQuestion extends BaseQuestion {
  type: 'mcq';
  content: McqContent;
}

export interface CodeReviewQuestion extends BaseQuestion {
  type: 'code-review';
  content: CodeReviewContent;
}

export type Question = McqQuestion | CodeReviewQuestion;

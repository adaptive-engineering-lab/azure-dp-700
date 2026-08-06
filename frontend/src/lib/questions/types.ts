export type Domain =
  | 'implement-manage'
  | 'ingest-transform'
  | 'monitor-optimize';

export const DOMAINS: Domain[] = [
  'implement-manage',
  'ingest-transform',
  'monitor-optimize',
];

export const DOMAIN_LABELS: Record<Domain, string> = {
  'implement-manage': 'Implement & Manage',
  'ingest-transform': 'Ingest & Transform',
  'monitor-optimize': 'Monitor & Optimize',
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
  topic: string;
  difficulty: 1 | 2 | 3;
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

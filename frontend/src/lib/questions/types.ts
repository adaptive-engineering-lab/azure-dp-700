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

export interface FlashcardContent {
  front: string;
  back: string;
}

export interface McqContent {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: 'A' | 'B' | 'C' | 'D';
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
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export interface BaseQuestion {
  id: string;
  type: 'flashcard' | 'mcq' | 'code-review';
  domain: Domain;
  topic: string;
  difficulty: 1 | 2 | 3;
}

export interface FlashcardQuestion extends BaseQuestion {
  type: 'flashcard';
  content: FlashcardContent;
}

export interface McqQuestion extends BaseQuestion {
  type: 'mcq';
  content: McqContent;
}

export interface CodeReviewQuestion extends BaseQuestion {
  type: 'code-review';
  content: CodeReviewContent;
}

export type Question = FlashcardQuestion | McqQuestion | CodeReviewQuestion;

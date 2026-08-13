import { LEARNING_PATHS } from './types';

/**
 * What a session is scoped to: one module, one learning path, or the whole
 * bank.
 *
 * A union rather than two independent fields because the three are mutually
 * exclusive — picking a path has to clear the module, and a URL carrying both
 * `topic` and `path` has no sensible meaning. Session pages read the same
 * parameters back, so the names here are the contract between the two.
 */
export type Selection =
  | { kind: 'all' }
  | { kind: 'module'; topic: string }
  | { kind: 'path'; id: string };

export function selectionFromParams(params: URLSearchParams): Selection {
  const topic = params.get('topic');
  if (topic) return { kind: 'module', topic };
  const id = params.get('path');
  if (id) return { kind: 'path', id };
  return { kind: 'all' };
}

/** The query-string pairs for a selection — nothing at all for 'all'. */
export function selectionParams(selection: Selection): [string, string][] {
  switch (selection.kind) {
    case 'module':
      return [['topic', selection.topic]];
    case 'path':
      return [['path', selection.id]];
    case 'all':
      return [];
  }
}

/** How the selection reads in a sentence, e.g. "12 questions available in …". */
export function selectionLabel(selection: Selection, fallbackAll: string): string {
  switch (selection.kind) {
    case 'module':
      return selection.topic;
    // An unknown id can only arrive from a hand-edited URL; show it rather
    // than pretending the selection is something else.
    case 'path':
      return LEARNING_PATHS[selection.id] ?? selection.id;
    case 'all':
      return fallbackAll;
  }
}

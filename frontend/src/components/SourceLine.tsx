import { primaryLearningPath } from '../lib/questions/types';

interface Props {
  /** The Microsoft Learn module title — the item's `topic`. */
  topic: string;
  tags?: string[];
}

/**
 * Provenance for an item: which Learn module it came from and, when the
 * importer recorded one, which learning path that module sits under.
 *
 * Render this only *after* the learner has answered. Shown alongside the
 * question it narrows the answer down, which defeats the point of the drill.
 */
export function SourceLine({ topic, tags }: Props) {
  const path = primaryLearningPath(tags);
  return (
    <p className="mt-3 border-t border-divider pt-3 text-xs text-fg-muted">
      <span className="font-medium text-fg">{topic}</span>
      {path && (
        <>
          <span aria-hidden> · </span>
          <span>{path}</span>
        </>
      )}
    </p>
  );
}

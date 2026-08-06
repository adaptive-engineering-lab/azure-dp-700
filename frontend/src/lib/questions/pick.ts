import type { Question } from './types';

/**
 * Pick up to `count` questions from `pool` in random order.
 *
 * This replaced a difficulty-weighted picker. The bank's `difficulty` values
 * are inferred by the importer from which quiz section a question came from,
 * not stated by the source material, so weighting by them expressed a
 * confidence the data does not support — and with no level-3 items at all, a
 * "hard" preference just fell through to easier questions. The column is still
 * there for when items are graded for real; until then selection ignores it.
 */
export function pickRandom<T extends Question>(
  pool: T[],
  count: number,
  rng: () => number = Math.random,
): T[] {
  return shuffle(pool, rng).slice(0, count);
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

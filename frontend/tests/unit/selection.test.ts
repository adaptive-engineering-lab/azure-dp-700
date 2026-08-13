import { describe, expect, it } from 'vitest';
import {
  selectionFromParams,
  selectionLabel,
  selectionParams,
} from '../../src/lib/questions/selection';
import { learningPathIds } from '../../src/lib/questions/types';

describe('learningPathIds', () => {
  it('reads every path: tag the importer wrote', () => {
    expect(learningPathIds(['ingest-transform', 'path:lp2', 'path:lp3', 'order:1'])).toEqual([
      'lp2',
      'lp3',
    ]);
  });

  it('returns paths in published order, not tag order', () => {
    expect(learningPathIds(['path:lp4', 'path:lp1'])).toEqual(['lp1', 'lp4']);
  });

  it('drops ids the frontend has no title for, so nothing renders blank', () => {
    expect(learningPathIds(['path:lp2', 'path:lp99'])).toEqual(['lp2']);
  });

  it('ignores primary-path, which is a display hint rather than membership', () => {
    expect(learningPathIds(['primary-path:lp3'])).toEqual([]);
  });

  it('treats missing tags as no paths', () => {
    expect(learningPathIds(undefined)).toEqual([]);
  });
});

describe('selectionFromParams', () => {
  it('defaults to the whole bank', () => {
    expect(selectionFromParams(new URLSearchParams())).toEqual({ kind: 'all' });
  });

  it('reads a module', () => {
    expect(selectionFromParams(new URLSearchParams('topic=Use%20Apache%20Spark'))).toEqual({
      kind: 'module',
      topic: 'Use Apache Spark',
    });
  });

  it('reads a learning path', () => {
    expect(selectionFromParams(new URLSearchParams('path=lp2'))).toEqual({
      kind: 'path',
      id: 'lp2',
    });
  });

  it('prefers the module when a hand-edited URL carries both', () => {
    expect(selectionFromParams(new URLSearchParams('topic=Spark&path=lp2'))).toEqual({
      kind: 'module',
      topic: 'Spark',
    });
  });
});

describe('selectionParams', () => {
  it('round-trips through the URL for each kind', () => {
    for (const selection of [
      { kind: 'all' },
      { kind: 'module', topic: 'Work with Delta Lake tables in Microsoft Fabric' },
      { kind: 'path', id: 'lp2' },
    ] as const) {
      const params = new URLSearchParams(selectionParams(selection));
      expect(selectionFromParams(params)).toEqual(selection);
    }
  });

  it('adds nothing for the whole bank, so the URL stays clean', () => {
    expect(selectionParams({ kind: 'all' })).toEqual([]);
  });
});

describe('selectionLabel', () => {
  it('names a path by its title', () => {
    expect(selectionLabel({ kind: 'path', id: 'lp2' }, 'all modules')).toBe(
      'Implement a Lakehouse with Microsoft Fabric',
    );
  });

  it('falls back to the raw id rather than mislabelling an unknown path', () => {
    expect(selectionLabel({ kind: 'path', id: 'lp99' }, 'all modules')).toBe('lp99');
  });

  it('uses the caller’s wording for the whole bank', () => {
    expect(selectionLabel({ kind: 'all' }, 'all modules')).toBe('all modules');
  });
});

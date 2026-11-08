import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { QuizAttemptSummary } from '../../src/lib/history/types';

vi.mock('../../src/lib/supabase', () => {
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'eq']) b[m] = () => b;
  b.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve({ data: null, count: 5, error: null }).then(resolve);
  return { supabase: () => ({ from: () => b }) };
});

vi.mock('../../src/lib/questions/useModules', () => ({
  useModules: () => ({
    loading: false,
    modules: [
      { topic: 'Taken Module', domain: 'implement-manage', count: 10 },
      { topic: 'Fresh Module', domain: 'implement-manage', count: 8 },
    ],
  }),
}));

let currentUser: { id: string } | null = null;
vi.mock('../../src/lib/auth/AuthProvider', () => ({
  useAuth: () => ({ user: currentUser, session: null, loading: false, signOut: async () => {} }),
}));

const summary = (topic: string | null, over: Partial<QuizAttemptSummary>): QuizAttemptSummary => ({
  topic,
  attemptCount: 1,
  bestScorePct: null,
  latestScorePct: null,
  lastTakenAt: '2026-06-01T00:00:00Z',
  ...over,
});

vi.mock('../../src/lib/history/useQuizSummaries', () => ({
  useQuizSummaries: (userId: string | undefined) => ({
    loading: false,
    error: null,
    summaries: userId
      ? new Map([
          ['Taken Module', summary('Taken Module', { attemptCount: 3, bestScorePct: 85 })],
          ['all-modules', summary(null, { attemptCount: 2, bestScorePct: null })],
        ])
      : new Map(),
  }),
}));

import QuizSelectPage from '../../src/pages/QuizSelectPage';

function renderPicker() {
  render(
    <MemoryRouter>
      <QuizSelectPage />
    </MemoryRouter>,
  );
}

describe('Quiz picker attempt badges (US2, FR-020)', () => {
  beforeEach(() => {
    currentUser = null;
  });

  it('shows count and best score on a module the learner has taken', () => {
    currentUser = { id: 'u1' };
    renderPicker();
    expect(screen.getByRole('button', { name: /Taken Module/ })).toHaveAccessibleName(
      /Taken 3× · best 85%/,
    );
  });

  it('shows no badge on a module never taken', () => {
    currentUser = { id: 'u1' };
    renderPicker();
    expect(screen.getByRole('button', { name: /Fresh Module/ })).not.toHaveTextContent(/Taken/);
  });

  it('counts the mixed quiz on its own, without a best score when none is known', () => {
    currentUser = { id: 'u1' };
    renderPicker();
    const all = screen.getByRole('button', { name: /^All modules/ });
    expect(all).toHaveTextContent('Taken 2×');
    expect(all).not.toHaveTextContent('best');
  });

  it('shows no badges to a guest', () => {
    renderPicker();
    expect(screen.queryByText(/Taken \d+×/)).toBeNull();
  });
});

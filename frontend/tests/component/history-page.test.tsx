import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ROUTES } from '../../src/lib/routes';
import { useAppStore } from '../../src/lib/store';

// ---- Supabase: a chainable query stub that records every call per request.
type Call = [method: string, ...args: unknown[]];
interface Request {
  table: string;
  calls: Call[];
}
const requests: Request[] = [];
let respond: (req: Request) => unknown[] = () => [];

function builder(table: string) {
  const req: Request = { table, calls: [] };
  requests.push(req);
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'is', 'gte', 'lt', 'order', 'limit', 'in']) {
    b[m] = (...args: unknown[]) => {
      req.calls.push([m, ...args]);
      return b;
    };
  }
  b.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve({ data: respond(req), error: null }).then(resolve, reject);
  return b;
}

vi.mock('../../src/lib/supabase', () => ({
  supabase: () => ({ from: (table: string) => builder(table) }),
}));

// ---- Auth: switch between guest and signed in per test.
let currentUser: { id: string } | null = null;
vi.mock('../../src/lib/auth/AuthProvider', () => ({
  useAuth: () => ({ user: currentUser, session: null, loading: false, signOut: async () => {} }),
}));

import HistoryPage from '../../src/pages/HistoryPage';

function row(i: number, over: Record<string, unknown> = {}) {
  return {
    id: `s${i}`,
    topic: 'Mod A',
    score_pct: 80,
    question_count: 10,
    correct_count: 8,
    duration_seconds: 125,
    completed_at: new Date(Date.UTC(2026, 5, 1, 12, 0) - i * 60_000).toISOString(),
    ...over,
  };
}

// A plain MemoryRouter, not createMemoryRouter: in jsdom, data-router
// navigations build a Request whose AbortSignal undici rejects.
const location = { search: '' };
function LocationProbe() {
  location.search = useLocation().search;
  return null;
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <LocationProbe />
      <Routes>
        <Route path={ROUTES.history} element={<HistoryPage />} />
        <Route path={ROUTES.quiz} element={<p>quiz picker</p>} />
        <Route path={ROUTES.signIn} element={<p>sign in page</p>} />
      </Routes>
    </MemoryRouter>,
  );
  return location;
}

const sessionRequests = () => requests.filter((r) => r.table === 'sessions');

describe('HistoryPage (US1)', () => {
  beforeEach(() => {
    requests.length = 0;
    respond = () => [];
    currentUser = null;
    useAppStore.getState().reset();
  });

  it('asks a guest to sign in and loads nothing', () => {
    renderAt(ROUTES.history);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('History');
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', ROUTES.signIn);
    expect(sessionRequests()).toHaveLength(0);
  });

  it('shows an empty state with a way to start a quiz', async () => {
    currentUser = { id: 'u1' };
    renderAt(ROUTES.history);
    const link = await screen.findByRole('link', { name: 'Start a quiz' });
    expect(link).toHaveAttribute('href', ROUTES.quiz);
  });

  it('lists attempts newest first with score, counts, duration and a text result', async () => {
    currentUser = { id: 'u1' };
    respond = (req) =>
      req.table === 'sessions'
        ? [
            row(0, { topic: 'Mod A', score_pct: 90 }),
            row(1, { topic: null, score_pct: 40 }),
            row(2, { topic: 'Mod B', score_pct: 70, question_count: null, correct_count: null }),
          ]
        : [];
    renderAt(ROUTES.history);

    const list = await screen.findByRole('list', { name: 'Quiz attempts' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Mod A');
    expect(items[0]).toHaveTextContent('90%');
    expect(items[0]).toHaveTextContent('8/10');
    expect(items[0]).toHaveTextContent('2:05');
    expect(items[0]).toHaveTextContent('Passed');
    expect(items[1]).toHaveTextContent('All modules');
    expect(items[1]).toHaveTextContent('Failed');
    expect(items[2]).toHaveTextContent('Passed'); // exactly 70%
    expect(items[2]).toHaveTextContent('—');

    const [req] = sessionRequests();
    expect(req!.calls).toContainEqual(['eq', 'user_id', 'u1']);
    expect(req!.calls).toContainEqual(['eq', 'mode', 'mcq']);
    expect(req!.calls).toContainEqual(['order', 'completed_at', { ascending: false }]);
    expect(req!.calls).toContainEqual(['limit', 51]);
  });

  it('labels an attempt that has not reached the server yet', async () => {
    currentUser = { id: 'u1' };
    useAppStore.getState().recordSession({
      mode: 'mcq',
      topic: 'Offline Mod',
      scorePct: 80,
      durationSeconds: 60,
      questionCount: 5,
      correctCount: 4,
      ownerId: 'u1',
    });
    renderAt(ROUTES.history);
    const list = await screen.findByRole('list', { name: 'Quiz attempts' });
    const [item] = within(list).getAllByRole('listitem');
    expect(item).toHaveTextContent('Offline Mod');
    expect(item).toHaveTextContent('Not yet synced');
  });

  it('shows 50 rows, then loads the next page from a completed_at cursor', async () => {
    currentUser = { id: 'u1' };
    respond = (req) => {
      if (req.table !== 'sessions') return [];
      const isNextPage = req.calls.some(([m]) => m === 'lt');
      return isNextPage
        ? [row(100), row(101)]
        : Array.from({ length: 51 }, (_, i) => row(i));
    };
    renderAt(ROUTES.history);

    const list = await screen.findByRole('list', { name: 'Quiz attempts' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(50);

    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    await screen.findByText((_, el) => el?.tagName === 'UL' && el.children.length === 52);

    const next = sessionRequests().find((r) => r.calls.some(([m]) => m === 'lt'))!;
    expect(next.calls).toContainEqual(['lt', 'completed_at', row(49).completed_at]);
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
  });
});

describe('HistoryPage by-quiz view (US2)', () => {
  beforeEach(() => {
    requests.length = 0;
    currentUser = { id: 'u1' };
    useAppStore.getState().reset();
    respond = (req) =>
      req.table === 'quiz_attempt_summaries'
        ? [
            {
              topic: 'Older Mod',
              attempt_count: 1,
              best_score_pct: 60,
              latest_score_pct: 60,
              last_taken_at: '2026-05-01T10:00:00Z',
            },
            {
              topic: null,
              attempt_count: 3,
              best_score_pct: 85,
              latest_score_pct: 70,
              last_taken_at: '2026-06-01T10:00:00Z',
            },
          ]
        : [];
  });

  it('lists each quiz with count, best, latest and last taken, newest first', async () => {
    renderAt(`${ROUTES.history}?view=by-quiz`);
    const list = await screen.findByRole('list', { name: 'Quizzes taken' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('All modules');
    expect(items[0]).toHaveTextContent('Taken 3×');
    expect(items[0]).toHaveTextContent('Best 85%');
    expect(items[0]).toHaveTextContent('Latest 70%');
    expect(items[0]).toHaveTextContent('Last taken');
    expect(items[1]).toHaveTextContent('Older Mod');
  });

  it("links each quiz to its filtered attempt list", async () => {
    renderAt(`${ROUTES.history}?view=by-quiz`);
    const list = await screen.findByRole('list', { name: 'Quizzes taken' });
    const [mixed, older] = within(list).getAllByRole('link');
    expect(mixed).toHaveAttribute('href', `${ROUTES.history}?quiz=all-modules`);
    expect(older).toHaveAttribute('href', `${ROUTES.history}?quiz=Older+Mod`);
  });

  it('switches views through the URL', async () => {
    const loc = renderAt(ROUTES.history);
    fireEvent.click(screen.getByRole('button', { name: 'By quiz' }));
    await screen.findByRole('list', { name: 'Quizzes taken' });
    expect(loc.search).toBe('?view=by-quiz');
    expect(screen.getByRole('button', { name: 'By quiz' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('HistoryPage filters (US3)', () => {
  beforeEach(() => {
    requests.length = 0;
    currentUser = { id: 'u1' };
    useAppStore.getState().reset();
    respond = (req) =>
      req.table === 'quiz_attempt_summaries'
        ? [
            {
              topic: 'Mod A',
              attempt_count: 2,
              best_score_pct: 80,
              latest_score_pct: 80,
              last_taken_at: '2026-06-01T10:00:00Z',
            },
          ]
        : [];
  });

  it('writes a changed filter to the URL', async () => {
    const loc = renderAt(ROUTES.history);
    await screen.findByLabelText('Result');
    fireEvent.change(screen.getByLabelText('Result'), { target: { value: 'failed' } });
    await screen.findByDisplayValue('Failed');
    expect(loc.search).toBe('?result=failed');
  });

  it('reads filters from the URL and sends them to the server', async () => {
    renderAt(`${ROUTES.history}?quiz=all-modules&range=7d`);
    expect(await screen.findByLabelText('Quiz')).toHaveValue('all-modules');
    expect(screen.getByLabelText('Date range')).toHaveValue('7d');
    await screen.findByText('No attempts match these filters.');

    const req = sessionRequests().at(-1)!;
    expect(req.calls).toContainEqual(['is', 'topic', null]);
    expect(req.calls.some(([m, col]) => m === 'gte' && col === 'completed_at')).toBe(true);
  });

  it('offers a way out when the filters match nothing', async () => {
    const loc = renderAt(`${ROUTES.history}?result=passed`);
    await screen.findByText('No attempts match these filters.');
    expect(screen.queryByRole('link', { name: 'Start a quiz' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    await screen.findByRole('link', { name: 'Start a quiz' });
    expect(loc.search).toBe('');
  });

  it('lists the quizzes the learner has taken as filter options', async () => {
    renderAt(ROUTES.history);
    const select = await screen.findByLabelText('Quiz');
    await within(select).findByRole('option', { name: 'Mod A' });
    expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Any quiz',
      'Mod A',
    ]);
  });
});

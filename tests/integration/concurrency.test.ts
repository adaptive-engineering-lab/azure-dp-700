import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { anonClient, serviceRoleClient, userClient } from '../../tools/test-helpers/clients.js';
import { createTestUser, cleanupTestUsers, type TestUser } from '../../tools/test-helpers/users.js';

/**
 * Behaviour under simultaneous use, sized for the ~100-user target.
 *
 * The realistic load is guests: no account, progress in localStorage, and the
 * only server interaction is reading the public question bank. That path is
 * covered by the fan-out test below. The signed-in tests cover the paths that
 * are cheap to get wrong rather than the ones that are common — RLS evaluated
 * per row, and the unique constraint on user_progress under contention.
 *
 * Deliberately modest concurrency: this is a correctness suite, and it runs
 * against a hosted project. Throughput belongs in tests/load (k6).
 */

const USERS = 12;
const FANOUT = 50;
const CONTENTION = 20;

describe('Concurrent use', () => {
  const admin = serviceRoleClient();
  let users: TestUser[] = [];
  let clients: SupabaseClient[] = [];
  let questionIds: string[] = [];

  beforeAll(async () => {
    await cleanupTestUsers();
    const { data, error } = await admin.from('questions').select('id').limit(USERS + 1);
    expect(error).toBeNull();
    questionIds = (data ?? []).map((r) => r.id as string);
    expect(
      questionIds.length,
      `bank needs at least ${USERS + 1} questions for this suite`,
    ).toBeGreaterThanOrEqual(USERS + 1);

    users = await Promise.all(
      Array.from({ length: USERS }, (_, i) => createTestUser(`conc-${i}`)),
    );
    clients = await Promise.all(users.map((u) => userClient(u.email, u.password)));
  }, 120_000);

  afterAll(async () => {
    // Mandatory: this suite runs against a hosted project.
    await cleanupTestUsers();
  }, 60_000);

  it(`isolates ${USERS} users writing progress simultaneously`, async () => {
    const writes = await Promise.all(
      clients.map((c, i) =>
        c.from('user_progress').insert({
          user_id: users[i]!.id,
          question_id: questionIds[i]!,
          times_seen: 1,
          times_correct: 1,
          last_rating: 'correct',
        }),
      ),
    );
    for (const [i, w] of writes.entries()) {
      expect(w.error, `user ${i} write failed: ${w.error?.message}`).toBeNull();
    }

    // Every user must see exactly their own row and nobody else's.
    const reads = await Promise.all(clients.map((c) => c.from('user_progress').select('*')));
    for (const [i, r] of reads.entries()) {
      expect(r.error).toBeNull();
      const rows = r.data ?? [];
      expect(rows, `user ${i} should see exactly 1 row`).toHaveLength(1);
      expect(rows[0]!.user_id, `user ${i} saw another user's row`).toBe(users[i]!.id);
    }
  }, 120_000);

  it(`isolates ${USERS} users writing sessions simultaneously`, async () => {
    const writes = await Promise.all(
      clients.map((c, i) =>
        c.from('sessions').insert({
          user_id: users[i]!.id,
          mode: 'mcq',
          topic: `concurrency probe ${i}`,
          score_pct: 50 + i,
          duration_seconds: 60,
        }),
      ),
    );
    for (const [i, w] of writes.entries()) {
      expect(w.error, `user ${i} session write failed: ${w.error?.message}`).toBeNull();
    }

    const reads = await Promise.all(clients.map((c) => c.from('sessions').select('user_id')));
    for (const [i, r] of reads.entries()) {
      expect(r.error).toBeNull();
      const rows = r.data ?? [];
      expect(rows).toHaveLength(1);
      expect(rows[0]!.user_id).toBe(users[i]!.id);
    }
  }, 120_000);

  it(`survives ${CONTENTION} concurrent upserts to the same progress row`, async () => {
    // Two devices, or a double-tap, hitting the same (user, question) at once.
    // user_progress_unique must hold and exactly one row must result.
    const client = clients[0]!;
    const user = users[0]!;
    const questionId = questionIds[USERS]!;

    const results = await Promise.all(
      Array.from({ length: CONTENTION }, (_, n) =>
        client
          .from('user_progress')
          .upsert(
            {
              user_id: user.id,
              question_id: questionId,
              times_seen: n + 1,
              times_correct: 1,
              last_rating: 'correct',
            },
            { onConflict: 'user_id,question_id' },
          )
          .select('id'),
      ),
    );

    const failures = results.filter((r) => r.error);
    expect(
      failures.map((f) => f.error?.message),
      'concurrent upserts must not violate user_progress_unique',
    ).toEqual([]);

    const { data: rows } = await client
      .from('user_progress')
      .select('id')
      .eq('question_id', questionId);
    expect(rows, 'exactly one row must survive the contention').toHaveLength(1);
  }, 120_000);

  it(`serves ${FANOUT} simultaneous anonymous bank reads — the guest path`, async () => {
    const anon = anonClient();
    const started = Date.now();
    const reads = await Promise.all(
      Array.from({ length: FANOUT }, () => anon.from('questions').select('id, type, domain')),
    );
    const elapsed = Date.now() - started;

    const errors = reads.filter((r) => r.error).map((r) => r.error!.message);
    expect(errors, 'anonymous reads must not error under fan-out').toEqual([]);

    const sizes = new Set(reads.map((r) => (r.data ?? []).length));
    expect(sizes.size, `inconsistent row counts across reads: ${[...sizes].join(', ')}`).toBe(1);

    console.log(`  ${FANOUT} parallel anon reads in ${elapsed}ms (${[...sizes][0]} rows each)`);
  }, 120_000);

  it('does not exhaust connections when reads and writes interleave', async () => {
    // The realistic mix: many guests reading while a few signed-in users write.
    const anon = anonClient();
    const work: Promise<{ error: unknown }>[] = [
      ...Array.from({ length: FANOUT }, () => anon.from('questions').select('id')),
      ...clients.map((c, i) =>
        c.from('sessions').insert({
          user_id: users[i]!.id,
          mode: 'code-review',
          topic: `interleaved ${i}`,
          score_pct: 70,
          duration_seconds: 30,
        }),
      ),
    ];
    const settled = await Promise.all(work);
    const errors = settled
      .map((r) => (r.error as { message?: string } | null)?.message)
      .filter(Boolean);
    expect(errors, 'no request may fail when reads and writes interleave').toEqual([]);
  }, 120_000);
});

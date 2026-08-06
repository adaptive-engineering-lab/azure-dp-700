import http from 'k6/http';
import { check } from 'k6';

/**
 * Guest read path under load.
 *
 * This is what ~100 concurrent users actually do: fetch the question bank
 * anonymously, then study entirely from localStorage. There are no writes on
 * this path, so it is the only server interaction that scales with headcount.
 *
 * Thresholds mirror tests/contract/query-latency.test.ts (p95 < 1000ms) so the
 * gate and the load test agree on what "fast enough" means.
 *
 * Run:
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... k6 run tests/load/bank-read.js
 *
 * This generates real traffic against a real project — see README.md.
 */

const SUPABASE_URL = __ENV.SUPABASE_URL;
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Set SUPABASE_URL and SUPABASE_ANON_KEY (see tests/load/README.md).');
}

export const options = {
  stages: [
    { duration: '30s', target: 25 },
    { duration: '30s', target: 100 },
    { duration: '60s', target: 100 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

const params = {
  headers: {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    Accept: 'application/json',
  },
  tags: { name: 'questions-bank' },
};

export default function () {
  // The exact query the app issues on a cold load of /learn.
  const url = `${SUPABASE_URL}/rest/v1/questions?select=id,type,domain,topic,difficulty,content,tags`;
  const res = http.get(url, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'returns a non-empty array': (r) => {
      try {
        return Array.isArray(r.json()) && r.json().length > 0;
      } catch {
        return false;
      }
    },
  });
}

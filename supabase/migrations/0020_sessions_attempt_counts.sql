-- Feature 014: quiz history and attempt counts.
--
-- A completed MCQ quiz is already a `sessions` row (mode 'mcq', topic = the
-- module title, or null for the mixed all-modules quiz). Two things were
-- missing for it to serve as a history:
--
--   * how many questions the attempt had and how many were right, so the
--     history can show "8/10" and not just a percentage. Both are nullable:
--     rows written before this migration have neither, and the UI shows "—".
--   * a per-quiz rollup (attempt count, best, latest) that does not need every
--     row shipped to the browser — PostgREST caps a response at 1000 rows, so
--     counting client-side would silently undercount a heavy user.
--
-- The view is security_invoker, so the RLS on `sessions` (0007) applies to
-- whoever queries it: a learner sees only their own rollup, and anon — granted
-- select to match 0019 — gets zero rows rather than a permission error.
--
-- Pass/fail is not stored. It is derived from score_pct against the frontend's
-- pass mark, so changing the mark never rewrites history.

alter table public.sessions
  add column question_count integer null,
  add column correct_count  integer null;

alter table public.sessions
  add constraint sessions_counts_chk check (
    (question_count is null and correct_count is null)
    or (question_count > 0 and correct_count between 0 and question_count)
  );

create view public.quiz_attempt_summaries
  with (security_invoker = on) as
select
  user_id,
  topic,
  count(*)::integer                                    as attempt_count,
  max(score_pct)                                       as best_score_pct,
  (array_agg(score_pct order by completed_at desc))[1] as latest_score_pct,
  max(completed_at)                                    as last_taken_at
from public.sessions
where mode = 'mcq'
group by user_id, topic;

grant select on public.quiz_attempt_summaries to authenticated, anon, service_role;

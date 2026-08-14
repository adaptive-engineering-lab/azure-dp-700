-- State the table privileges the schema has always assumed.
--
-- Every policy in 0002/0007/0009/0010/0011 is written as if anon,
-- authenticated and service_role already hold table-level grants. On a hosted
-- Supabase project they do: the platform bootstraps
--
--   alter default privileges in schema public
--     grant all on tables to postgres, anon, authenticated, service_role;
--
-- so anything a migration creates is automatically reachable and RLS is the
-- only thing standing between a caller and a row. The CLI's local stack
-- applies no such default, so on a fresh `supabase start` these tables have no
-- grants at all and every request fails with 42501 before RLS is ever
-- consulted — which is why the data-layer job has never once passed.
--
-- Granting explicitly here removes the environment split. It widens nothing on
-- the hosted project (identical privileges, re-granted) and it does not weaken
-- the model anywhere: RLS is enabled on all seven tables, so a grant is
-- permission to ask, not permission to see. The grants below mirror each
-- table's policies exactly — where there is no policy, there is no grant.

-- questions: world-readable bank; writes are gated on public.admins by RLS.
grant select                         on public.questions      to anon, authenticated;
grant insert, update, delete         on public.questions      to authenticated;

-- Per-learner tables. RLS narrows every one of these to auth.uid() = owner.
-- profiles has no INSERT policy (rows come from the on_auth_user_created
-- trigger) and no DELETE policy (cascade from auth.users), so neither is
-- granted.
grant select, update                 on public.profiles       to authenticated;
grant select, insert, update, delete on public.user_progress  to authenticated;
grant select, insert, update, delete on public.sessions       to authenticated;

-- Read-only to their owner; written by the webhook with the service role.
grant select                         on public.subscriptions  to authenticated;
-- Membership is readable only by the member; mutated out-of-band.
grant select                         on public.admins         to authenticated;

-- The service role bypasses RLS but still needs the table grant. It is the
-- only role that may touch webhook_events, whose RLS has no policies at all.
grant all on public.questions, public.profiles, public.user_progress,
             public.sessions, public.subscriptions, public.admins,
             public.webhook_events
  to service_role;

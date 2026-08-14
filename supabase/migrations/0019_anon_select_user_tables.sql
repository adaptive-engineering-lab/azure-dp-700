-- Let RLS, not the grant system, be what denies anon on the user tables.
--
-- 0018 granted the per-user tables to `authenticated` only, which is the
-- tighter posture but changes the shape of the denial: without a table grant
-- an anonymous request fails 42501, where on a hosted project (which grants
-- anon by default) the same request succeeds and RLS returns an empty set.
--
-- tests/integration/anon-no-read.test.ts asserts the second shape on purpose —
-- "RLS returns zero rows rather than leaking the existence of records via an
-- error" — so the grant belongs here to keep local and hosted identical, which
-- was the whole point of 0018.
--
-- This exposes nothing. RLS is enabled on all five tables and not one of them
-- has a policy naming `anon`, so an anonymous caller is structurally incapable
-- of matching a row: it may ask, and the answer is always zero rows. Write
-- access is not granted, and the INSERT cases in that same suite stay
-- rejected. webhook_events is deliberately excluded — it holds raw Stripe
-- payloads, has no policies at all, and nothing anonymous has any business
-- asking.

grant select on public.profiles      to anon;
grant select on public.user_progress to anon;
grant select on public.sessions      to anon;
grant select on public.subscriptions to anon;
grant select on public.admins        to anon;

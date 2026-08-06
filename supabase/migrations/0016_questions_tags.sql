-- Persist item tags, and make the seed RPC notice envelope-only edits.
--
-- Two problems this fixes:
--
-- 1. `tags` existed in the seed JSON and in the JSON Schemas from day one but
--    was never a column, so it was silently dropped on the way into the
--    database. The importer now writes `module:<slug>`, `path:<id>`, and
--    `primary-path:<id>` tags that the UI needs, so the column has to exist.
--
-- 2. seed_upsert_questions classified a row as 'unchanged' whenever
--    content_hash matched. content_hash covers the `content` payload only, so
--    editing an envelope field — topic, domain, difficulty, source, tags —
--    never propagated: the seed reported "unchanged" and wrote nothing. The
--    classification below compares every mutable column instead.

alter table public.questions
  add column if not exists tags text[] not null default '{}';

create index if not exists questions_tags_idx on public.questions using gin (tags);

create or replace function public.seed_upsert_questions(items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted int := 0;
  v_updated  int := 0;
  v_unchanged int := 0;
begin
  with input as (
    select
      (item->>'id')::uuid                              as id,
      item->>'type'                                    as type,
      item->>'domain'                                  as domain,
      item->>'topic'                                   as topic,
      (item->>'difficulty')::smallint                  as difficulty,
      item->>'source'                                  as source,
      nullif(item->>'reviewer_id','')                  as reviewer_id,
      nullif(item->>'reviewed_at','')::timestamptz     as reviewed_at,
      item->'content'                                  as content,
      item->>'content_hash'                            as content_hash,
      coalesce(
        array(select jsonb_array_elements_text(item->'tags')),
        '{}'::text[]
      )                                                as tags
    from jsonb_array_elements(items) as item
  ),
  classified as (
    select
      input.*,
      case
        when existing.id is null then 'insert'
        -- Compare every mutable column, not just the content hash, so an
        -- envelope-only edit is still written.
        when existing.content_hash is not distinct from input.content_hash
         and existing.type         is not distinct from input.type
         and existing.domain       is not distinct from input.domain
         and existing.topic        is not distinct from input.topic
         and existing.difficulty   is not distinct from input.difficulty
         and existing.source       is not distinct from input.source
         and existing.reviewer_id  is not distinct from input.reviewer_id
         and existing.reviewed_at  is not distinct from input.reviewed_at
         and existing.tags         is not distinct from input.tags
        then 'unchanged'
        else 'update'
      end as op
    from input
    left join public.questions as existing on existing.id = input.id
  ),
  ins as (
    insert into public.questions
      (id, type, domain, topic, difficulty, source, reviewer_id, reviewed_at, content, content_hash, tags)
    select id, type, domain, topic, difficulty, source, reviewer_id, reviewed_at, content, content_hash, tags
    from classified
    where op = 'insert'
    returning 1
  ),
  upd as (
    update public.questions q
       set type         = c.type,
           domain       = c.domain,
           topic        = c.topic,
           difficulty   = c.difficulty,
           source       = c.source,
           reviewer_id  = c.reviewer_id,
           reviewed_at  = c.reviewed_at,
           content      = c.content,
           content_hash = c.content_hash,
           tags         = c.tags
      from classified c
     where q.id = c.id and c.op = 'update'
    returning 1
  )
  select
    (select count(*) from ins),
    (select count(*) from upd),
    (select count(*) from classified where op = 'unchanged')
  into v_inserted, v_updated, v_unchanged;

  return jsonb_build_object(
    'inserted',  v_inserted,
    'updated',   v_updated,
    'unchanged', v_unchanged
  );
end;
$$;

revoke all on function public.seed_upsert_questions(jsonb) from anon, authenticated, public;

-- Retire flashcard mode.
--
-- The DP-700 bank is built from practice-quiz markdown, whose true/false
-- section now imports as a two-option MCQ (A = True, B = False) rather than a
-- flashcard. With no remaining producer of flashcards, the type is dropped
-- from the question and session constraints.
--
-- Run order matters: delete the rows before tightening the constraint, or the
-- ALTER fails validating existing data.

-- 1. Drop flashcard rows. Cascades to user_progress via its FK, so any
--    ratings recorded against them go too — intended, the items are gone.
delete from public.questions where type = 'flashcard';

-- 2. questions.type no longer admits 'flashcard'.
alter table public.questions drop constraint if exists questions_type_chk;
alter table public.questions add constraint questions_type_chk
  check (type in ('mcq', 'code-review'));

-- 3. The content-shape check loses its flashcard branch. mcq keeps requiring
--    the same four keys; two-option items still satisfy it because the check
--    tests for key presence, not the option count (that's the JSON Schema's
--    job, and it now requires only options A and B).
alter table public.questions drop constraint if exists questions_content_shape_chk;
alter table public.questions add constraint questions_content_shape_chk
  check (
    (type = 'mcq'          and content ? 'question'  and content ? 'options'
                           and content ? 'correct'   and content ? 'explanation')
    or (type = 'code-review'   and content ? 'sub_mode'  and content ? 'language'
                               and content ? 'snippet'   and content ? 'prompt'
                               and content ? 'options'   and content ? 'correct'
                               and content ? 'explanation')
  );

-- 4. Sessions can no longer be recorded against the removed mode. Historic
--    rows are deleted first for the same reason as above.
delete from public.sessions where mode = 'flashcards';
alter table public.sessions drop constraint if exists sessions_mode_chk;
alter table public.sessions add constraint sessions_mode_chk
  check (mode in ('mcq', 'code-review', 'daily-review'));

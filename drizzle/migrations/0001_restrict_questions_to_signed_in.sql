drop policy if exists "public read" on public.questions;
drop policy if exists "public read" on public.question_options;
revoke select on public.questions from anon;
revoke select on public.question_options from anon;
create policy "signed-in read" on public.questions for select to authenticated using (auth.uid() is not null);
create policy "signed-in read" on public.question_options for select to authenticated using (auth.uid() is not null);
-- Run in the SQL Editor of your existing Supabase project.
-- Creates only the private bucket; no game files or access policies are added.
-- Safe to run again. Existing buckets and policies are not modified.

begin;

insert into storage.buckets (id, name, public)
values ('2000-assets', '2000-assets', false)
on conflict (id) do nothing;

do $$
begin
  if exists (
    select 1 from storage.buckets
    where id = '2000-assets' and public = true
  ) then
    raise exception '2000-assets already exists as a public bucket. No changes made; review its settings first.';
  end if;
end
$$;

commit;

select id, name, public
from storage.buckets
where id = '2000-assets';

-- CivicFix Supabase setup
-- Run in Supabase Dashboard > SQL Editor > New query.
-- Public users can read reports. Signed-in users can submit reports.
-- Report status is not editable by normal users.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 100),
  category text not null,
  description text not null check (char_length(description) between 10 and 5000),
  location text not null check (char_length(location) between 2 and 200),
  severity text not null check (severity in ('Low', 'Medium', 'High')),
  status text not null default 'Reported' check (status in ('Reported', 'Under Review', 'In Progress', 'Resolved')),
  observed_date date not null,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_user_id_idx on public.reports (user_id);
create index if not exists reports_status_idx on public.reports (status);

alter table public.reports enable row level security;

-- Remove these policies first so this script can be safely re-run.
drop policy if exists "Public can read reports" on public.reports;
drop policy if exists "Signed-in users can submit reports" on public.reports;
drop policy if exists "Admins can update report status" on public.reports;

-- Public report feed. Do not store reporter email/phone in this table.
create policy "Public can read reports"
  on public.reports for select
  to anon, authenticated
  using (true);

create policy "Signed-in users can submit reports"
  on public.reports for insert
  to authenticated
  with check (auth.uid() = user_id and status = 'Reported');

-- Admin status changes require the user's JWT app_metadata.role to be 'admin'.
create policy "Admins can update report status"
  on public.reports for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Normal users cannot update/delete reports. Grant only the needed table actions.
revoke all on public.reports from anon, authenticated;
grant select on public.reports to anon, authenticated;
grant insert on public.reports to authenticated;
grant update (status, updated_at) on public.reports to authenticated;

-- Keep updated_at in sync for updates.
create or replace function public.set_report_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
before update on public.reports
for each row execute function public.set_report_updated_at();

-- Storage bucket for issue photos. Public read is intentional for public issue cards.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('civicfix-reports', 'civicfix-reports', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "Public can view report photos" on storage.objects;
drop policy if exists "Signed-in users can upload report photos" on storage.objects;

create policy "Public can view report photos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'civicfix-reports');

create policy "Signed-in users can upload report photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'civicfix-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

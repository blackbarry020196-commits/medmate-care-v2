-- MedMate v2 — Family Dashboard (run in Supabase SQL Editor)

-- Profiles extras
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create or replace function public.touch_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_profile_updated_at();

-- Family tables
create table if not exists public.family_invites (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  email text,
  token text unique not null,
  accepted boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.family_links (
  id uuid primary key default gen_random_uuid(),
  family_user_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (family_user_id, patient_id)
);

create table if not exists public.medication_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete cascade,
  scheduled_time timestamptz not null,
  taken_at timestamptz,
  status text not null default 'upcoming' check (status in ('taken', 'missed', 'upcoming')),
  created_at timestamptz not null default now()
);

create index if not exists medication_logs_patient_scheduled_idx
  on public.medication_logs (patient_id, scheduled_time);

alter table public.family_invites enable row level security;
alter table public.family_links enable row level security;
alter table public.medication_logs enable row level security;

-- Profiles: family can read linked patients
drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own or linked" on public.profiles
  for select using (
    id = auth.uid()
    or exists (
      select 1 from public.family_links
      where family_user_id = auth.uid() and patient_id = profiles.id
    )
  );

create policy "profiles insert own" on public.profiles for insert with check (id = auth.uid());
create policy "profiles update own" on public.profiles for update using (id = auth.uid());

-- Family invites
drop policy if exists "Patients manage own invites" on public.family_invites;
create policy "Patients manage own invites" on public.family_invites
  for all using (auth.uid() = patient_id) with check (auth.uid() = patient_id);

-- Family links
drop policy if exists "Users read own family links" on public.family_links;
create policy "Users read own family links" on public.family_links
  for select using (auth.uid() = family_user_id or auth.uid() = patient_id);

drop policy if exists "Family insert own links" on public.family_links;
create policy "Family insert own links" on public.family_links
  for insert with check (auth.uid() = family_user_id);

-- Medication logs
drop policy if exists "Patients manage own logs" on public.medication_logs;
create policy "Patients manage own logs" on public.medication_logs
  for all using (auth.uid() = patient_id) with check (auth.uid() = patient_id);

drop policy if exists "Family can read linked patient logs" on public.medication_logs;
create policy "Family can read linked patient logs" on public.medication_logs
  for select using (
    exists (
      select 1 from public.family_links
      where family_user_id = auth.uid() and patient_id = medication_logs.patient_id
    )
  );

-- Linked patient data for family dashboard
drop policy if exists "Family read linked medications" on public.medications;
create policy "Family read linked medications" on public.medications
  for select using (
    exists (
      select 1 from public.family_links
      where family_user_id = auth.uid() and patient_id = medications.user_id
    )
  );

drop policy if exists "Family read linked reminders" on public.reminders;
create policy "Family read linked reminders" on public.reminders
  for select using (
    exists (
      select 1 from public.family_links
      where family_user_id = auth.uid() and patient_id = reminders.user_id
    )
  );

-- Public invite preview (token lookup before login)
create or replace function public.get_invite_preview(invite_token text)
returns table (invite_id uuid, patient_name text, accepted boolean)
language sql
security definer
set search_path = public
as $$
  select fi.id, p.full_name, fi.accepted
  from public.family_invites fi
  join public.profiles p on p.id = fi.patient_id
  where fi.token = invite_token;
$$;

grant execute on function public.get_invite_preview(text) to anon, authenticated;

-- Accept invite after signup/login
create or replace function public.accept_family_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.family_invites%rowtype;
  fam_id uuid := auth.uid();
begin
  if fam_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into inv
  from public.family_invites
  where token = invite_token and accepted = false;

  if not found then
    raise exception 'Invalid or already used invite link';
  end if;

  insert into public.family_links (family_user_id, patient_id)
  values (fam_id, inv.patient_id)
  on conflict (family_user_id, patient_id) do nothing;

  update public.family_invites set accepted = true where id = inv.id;
  update public.profiles set role = 'family' where id = fam_id;

  return inv.patient_id;
end;
$$;

grant execute on function public.accept_family_invite(text) to authenticated;

-- Sync missed medication logs (callable by patient or linked family)
create or replace function public.sync_medication_logs(p_patient_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'Not authenticated';
  end if;

  if caller <> p_patient_id and not exists (
    select 1 from public.family_links
    where family_user_id = caller and patient_id = p_patient_id
  ) then
    raise exception 'Not authorized';
  end if;

  update public.medication_logs
  set status = 'missed'
  where patient_id = p_patient_id
    and status = 'upcoming'
    and scheduled_time < now()
    and taken_at is null;
end;
$$;

grant execute on function public.sync_medication_logs(uuid) to authenticated;

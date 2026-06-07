-- MedMate v2 — initial schema (run in Supabase SQL Editor on a NEW project)

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'patient' check (role in ('patient', 'family')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create table public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  dosage text not null,
  frequency text not null,
  instructions text,
  start_date date not null default current_date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.medications enable row level security;
create index medications_user_id_idx on public.medications(user_id);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  scheduled_time time not null,
  days_of_week text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.reminders enable row level security;
create index reminders_user_id_idx on public.reminders(user_id);

create table public.dose_logs (
  id uuid primary key default gen_random_uuid(),
  reminder_id uuid not null references public.reminders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  scheduled_at timestamptz not null,
  taken_at timestamptz,
  status text not null default 'pending' check (status in ('taken', 'missed', 'pending')),
  created_at timestamptz not null default now()
);
alter table public.dose_logs enable row level security;
create index dose_logs_user_scheduled_idx on public.dose_logs(user_id, scheduled_at);

-- RLS: users can only access their own data
create policy "profiles select own" on public.profiles for select using (id = auth.uid());
create policy "profiles insert own" on public.profiles for insert with check (id = auth.uid());
create policy "profiles update own" on public.profiles for update using (id = auth.uid());

create policy "medications all own" on public.medications for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "reminders all own" on public.reminders for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "dose_logs all own" on public.dose_logs for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'patient')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

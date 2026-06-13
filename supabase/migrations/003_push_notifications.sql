-- MedMate v2 — Push notifications

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users manage own subscriptions" on public.push_subscriptions;
create policy "Users manage own subscriptions" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Prevent duplicate missed-med alerts to the same family member
create table if not exists public.push_notification_log (
  id uuid primary key default gen_random_uuid(),
  medication_log_id uuid not null references public.medication_logs(id) on delete cascade,
  family_user_id uuid not null references auth.users(id) on delete cascade,
  sent_at timestamptz not null default now(),
  unique (medication_log_id, family_user_id)
);

create index if not exists push_notification_log_family_idx
  on public.push_notification_log (family_user_id, sent_at desc);

alter table public.push_notification_log enable row level security;

-- Only service role / edge functions write notification logs; users don't need direct access
create policy "No direct access to notification log" on public.push_notification_log
  for all using (false);

-- Service role can manage subscriptions for cleanup from API routes
grant all on public.push_subscriptions to service_role;
grant all on public.push_notification_log to service_role;

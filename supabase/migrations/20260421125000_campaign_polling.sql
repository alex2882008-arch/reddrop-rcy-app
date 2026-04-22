create table if not exists public.campaign_participants (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('joined', 'cancelled', 'yes', 'no', 'maybe')),
  role text not null check (role in ('admin', 'rcy')),
  user_name text,
  user_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, user_id)
);

create index if not exists campaign_participants_campaign_idx
  on public.campaign_participants (campaign_id);

create index if not exists campaign_participants_user_idx
  on public.campaign_participants (user_id);

create or replace function public.set_campaign_participants_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_campaign_participants_updated_at on public.campaign_participants;
create trigger trg_campaign_participants_updated_at
before update on public.campaign_participants
for each row execute function public.set_campaign_participants_updated_at();

alter table public.campaign_participants enable row level security;

drop policy if exists "campaign participants read" on public.campaign_participants;
create policy "campaign participants read"
on public.campaign_participants
for select
to authenticated
using (true);

drop policy if exists "campaign participants write self" on public.campaign_participants;
create policy "campaign participants write self"
on public.campaign_participants
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "campaign participants update self" on public.campaign_participants;
create policy "campaign participants update self"
on public.campaign_participants
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

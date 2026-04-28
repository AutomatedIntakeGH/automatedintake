-- Run this in Supabase SQL Editor (once)

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  shop_name text,
  trade text check (trade in ('auto','hvac','plumbing','electrical','roofing','landscaping','contractor')),
  plan text not null default 'free' check (plan in ('free','solo','pro','shop','enterprise')),
  stripe_customer_id text,
  stripe_subscription_id text,
  monthly_wo_count int not null default 0,
  monthly_wo_reset_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Work orders
create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  trade text not null,
  status text not null default 'draft' check (status in ('draft','final','sent','archived')),
  customer jsonb,
  vehicle jsonb,
  property jsonb,
  concerns jsonb,
  notes text,
  recommended_actions jsonb,
  follow_up_questions jsonb,
  sentiment text,
  audio_url text,
  transcript text,
  raw_extraction jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.work_orders enable row level security;

create policy "Users can manage own work orders"
  on public.work_orders for all
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger work_orders_updated_at
  before update on public.work_orders
  for each row execute procedure public.set_updated_at();

-- Supabase Storage bucket for audio
insert into storage.buckets (id, name, public)
values ('audio', 'audio', false)
on conflict do nothing;

create policy "Users can upload own audio"
  on storage.objects for insert
  with check (bucket_id = 'audio' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can read own audio"
  on storage.objects for select
  using (bucket_id = 'audio' and auth.uid()::text = (storage.foldername(name))[1]);

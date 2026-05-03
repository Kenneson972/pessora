-- PESSORA – Schéma Supabase (profiles, subscriptions, products, events, RLS)
-- Exécuter dans l’éditeur SQL du dashboard Supabase.

-- ============================================================
-- 1. PROFILES (lié à auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  phone text,
  avatar_url text,
  role text default 'member' check (role in ('member', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger: créer un profile à chaque signUp
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS profiles
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================================
-- 2. SUBSCRIPTIONS
-- ============================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'starter', 'premium', 'vip')),
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  start_date date default current_date,
  end_date date,
  auto_renew boolean default false,
  price numeric(10,2) default 0,
  stripe_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- RLS subscriptions
alter table public.subscriptions enable row level security;

create policy "Users can read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can update own subscription"
  on public.subscriptions for update
  using (auth.uid() = user_id);

-- Insert free subscription for new users (optionnel: faire dans le trigger handle_new_user si souhaité)
-- Ici on crée la subscription dans le trigger après création du profile
create or replace function public.create_free_subscription()
returns trigger as $$
begin
  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_created_subscription on public.profiles;
create trigger on_profile_created_subscription
  after insert on public.profiles
  for each row execute function public.create_free_subscription();

-- ============================================================
-- 3. PRODUCTS (menu / admin)
-- ============================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text check (category in ('wellness', 'energie', 'shakes', 'coffee')),
  price numeric(10,2),
  calories int,
  protein int,
  description text,
  ingredients text[],
  benefits text[],
  image_url text,
  created_at timestamptz default now()
);

alter table public.products enable row level security;

create policy "Products are readable by everyone"
  on public.products for select
  using (true);

create policy "Only admins can insert products"
  on public.products for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Only admins can update products"
  on public.products for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Only admins can delete products"
  on public.products for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- 4. EVENTS
-- ============================================================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date text,
  location text,
  type text check (type in ('popup', 'event')),
  description text,
  image_url text,
  created_at timestamptz default now()
);

alter table public.events enable row level security;

create policy "Events are readable by everyone"
  on public.events for select
  using (true);

create policy "Only admins can insert events"
  on public.events for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Only admins can update events"
  on public.events for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Only admins can delete events"
  on public.events for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- 5. updated_at trigger (optionnel)
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

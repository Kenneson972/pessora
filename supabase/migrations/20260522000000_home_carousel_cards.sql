create table public.home_carousel_cards (
  id         uuid primary key default gen_random_uuid(),
  position   integer not null default 0,
  eyebrow    text    not null default '',
  title      text    not null default '',
  image_url  text,
  link_to    text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.home_carousel_cards enable row level security;

create policy "public read" on public.home_carousel_cards
  for select using (true);

create policy "admin write" on public.home_carousel_cards
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

create index home_carousel_cards_position_idx on public.home_carousel_cards (position asc);

insert into public.home_carousel_cards (position, eyebrow, title, image_url, link_to, active) values
  (1, 'Wellness · Coup de cœur', 'Ton moment bien-être', null, '/menu?gamme=wellness', true),
  (2, 'Shakes · Protéinés', 'Shake Mangue Passion', null, '/menu?gamme=shakes', true),
  (3, 'Coffee · Martinique', 'Coffee glacé maison', null, '/menu?gamme=coffee', true);

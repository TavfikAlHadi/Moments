create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text,
  created_at timestamptz not null default now()
);

alter table leads enable row level security;

-- Allow the public anon key to insert leads (contact form), but not read/update/delete.
create policy "anon can submit leads"
  on leads for insert
  to anon
  with check (true);

-- Pricing tiers shown in the price calculator. Edit rows directly in the
-- Supabase Studio Table Editor to change name/price/photo count/image.
create table if not exists pricing_tiers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null,
  photos int not null,
  image_url text not null,
  sort_order int not null default 0
);

alter table pricing_tiers enable row level security;

-- Unique name so "on conflict do nothing" below actually has something to
-- target, and so the price lookup in create-checkout-session.ts (.single())
-- can't break on duplicate rows if this file is re-run.
do $$ begin
  alter table pricing_tiers add constraint pricing_tiers_name_key unique (name);
exception when duplicate_object then null;
end $$;

-- Public site reads tiers; only edit via Studio (which uses your own login, not anon).
create policy "anon can read pricing tiers"
  on pricing_tiers for select
  to anon
  using (true);

insert into pricing_tiers (name, price, photos, image_url, sort_order) values
  ('Basic', 49.9, 20, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=70', 1),
  ('Medium', 159.9, 250, 'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=500&q=70', 2),
  ('Advance', 269.9, 400, 'https://images.unsplash.com/photo-1519638831568-d9897f54ed69?w=500&q=70', 3)
on conflict do nothing;

-- Storage bucket for staff-uploaded tier photos (public read).
insert into storage.buckets (id, name, public)
values ('pricing-images', 'pricing-images', true)
on conflict (id) do nothing;

create policy "public can view pricing images"
  on storage.objects for select
  to public
  using (bucket_id = 'pricing-images');

-- Orders placed via Stripe Checkout. No anon policies: only the service-role
-- key (used inside Netlify Functions) reads/writes this table.
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  tier_name text not null,
  package_price numeric not null,
  courier_fee numeric not null default 0,
  total numeric not null,
  currency text not null default 'MYR',
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  fulfillment_method text not null check (fulfillment_method in ('pickup', 'courier')),
  region text check (region in ('peninsular', 'east_malaysia')),
  shipping_address jsonb,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

-- Free-text notes captured at order time (e.g. the customer's own slider estimate).
alter table orders add column if not exists notes text;

alter table orders enable row level security;

-- Profile row per auth.users signup. id mirrors auth.users(id) so RLS can
-- check auth.uid() = id directly, no join needed.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "users can read own profile" on profiles;
create policy "users can read own profile"
  on profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "users can update own profile" on profiles;
create policy "users can update own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- Auto-create profile row on signup so the app never has to do it client-side.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

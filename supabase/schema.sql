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

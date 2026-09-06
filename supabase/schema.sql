-- Sweetbites schema (run in Supabase SQL editor or via CLI)

create extension if not exists "pgcrypto";

create table if not exists categories (
  id text primary key,
  name_en text not null,
  name_es text not null,
  slug text not null unique,
  sort int not null default 0
);

create table if not exists products (
  id text primary key,
  category_id text not null references categories(id),
  name_en text not null,
  name_es text not null,
  slug text not null unique,
  description_en text not null,
  description_es text not null,
  price_cents int not null,
  image_url text not null,
  lead_days int not null default 0,
  ship_weight_g int not null default 500,
  ship_l_cm int not null default 20,
  ship_w_cm int not null default 20,
  ship_h_cm int not null default 10,
  active boolean not null default true
);

create table if not exists product_options (
  id text primary key,
  product_id text not null references products(id) on delete cascade,
  name_en text not null,
  name_es text not null,
  required boolean not null default false,
  max_select int not null default 1
);

create table if not exists option_values (
  id text primary key,
  option_id text not null references product_options(id) on delete cascade,
  name_en text not null,
  name_es text not null
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending',
  fulfillment text not null check (fulfillment in ('pickup', 'ship')),
  lang text not null default 'en',
  customer_name text not null,
  phone text not null,
  ship_street text,
  ship_city text,
  ship_province text,
  ship_postal text,
  notes text,
  food_cents int not null,
  shipping_cents int not null default 0,
  total_cents int not null,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id text not null references products(id),
  qty int not null,
  unit_price_cents int not null,
  options_json jsonb not null default '{}'
);

create table if not exists shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  carrier text not null default 'canada_post',
  service_code text not null,
  rate_cents int not null,
  tracking_pin text,
  label_url text,
  raw_json jsonb,
  created_at timestamptz not null default now()
);

alter table categories enable row level security;
alter table products enable row level security;
alter table product_options enable row level security;
alter table option_values enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table shipments enable row level security;

create policy "Public read categories" on categories for select using (true);
create policy "Public read products" on products for select using (true);
create policy "Public read product_options" on product_options for select using (true);
create policy "Public read option_values" on option_values for select using (true);

create policy "Public insert orders" on orders for insert with check (true);
create policy "Public insert order_items" on order_items for insert with check (true);
create policy "Public insert shipments" on shipments for insert with check (true);

-- No public update/delete policies (deny by default)

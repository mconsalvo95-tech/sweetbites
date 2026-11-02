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
  fulfillment text not null check (fulfillment in ('pickup', 'delivery', 'ship')),
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
  product_id text references products(id) on delete set null,
  qty int not null,
  unit_price_cents int not null,
  options_json jsonb not null default '{}',
  name_en text,
  name_es text
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

drop policy if exists "Public read categories" on categories;
create policy "Public read categories" on categories for select using (true);
drop policy if exists "Public read products" on products;
create policy "Public read products" on products for select using (true);
drop policy if exists "Public read product_options" on product_options;
create policy "Public read product_options" on product_options for select using (true);
drop policy if exists "Public read option_values" on option_values;
create policy "Public read option_values" on option_values for select using (true);

drop policy if exists "Public insert orders" on orders;
create policy "Public insert orders" on orders for insert with check (true);
drop policy if exists "Public insert order_items" on order_items;
create policy "Public insert order_items" on order_items for insert with check (true);
drop policy if exists "Public insert shipments" on shipments;
create policy "Public insert shipments" on shipments for insert with check (true);

-- No public update/delete policies (deny by default)

-- Phase Auth: profiles + order ownership

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'wholesale', 'admin')),
  newsletter boolean not null default false,
  address_street text,
  address_city text,
  address_province text,
  address_postal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "Users read own profile" on profiles;
create policy "Users read own profile" on profiles
  for select using (auth.uid() = id);

drop policy if exists "Users update own profile" on profiles;
create policy "Users update own profile" on profiles
  for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute function public.set_profiles_updated_at();

alter table orders add column if not exists user_id uuid references auth.users(id);

alter table orders drop constraint if exists orders_fulfillment_check;
alter table orders add constraint orders_fulfillment_check
  check (fulfillment in ('pickup', 'delivery', 'ship'));

drop policy if exists "Users read own orders" on orders;
create policy "Users read own orders" on orders
  for select using (auth.uid() = user_id);

create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('wholesale', 'contact', 'newsletter')),
  lang text not null default 'en',
  email text not null,
  name text,
  phone text,
  business text,
  city text,
  message text,
  order_number text,
  created_at timestamptz not null default now()
);

alter table inquiries enable row level security;

drop policy if exists "Public insert inquiries" on inquiries;
create policy "Public insert inquiries" on inquiries
  for insert with check (true);

-- Phase B: promo codes (food only; shipping unchanged)

create table if not exists promo_codes (
  code text primary key,
  kind text not null check (kind in ('percent', 'fixed')),
  value int not null check (value > 0),
  min_food_cents int not null default 0 check (min_food_cents >= 0),
  active boolean not null default true,
  expires_at timestamptz
);

alter table promo_codes enable row level security;

drop policy if exists "Public read active promos" on promo_codes;
create policy "Public read active promos" on promo_codes
  for select using (active = true);

alter table orders add column if not exists promo_code text;
alter table orders add column if not exists discount_cents int not null default 0;
alter table orders add column if not exists customer_email text;

-- Admin: bakery owner edits promos + weekly offers in /admin

create table if not exists admin_emails (
  email text primary key
);

alter table admin_emails enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

drop policy if exists "Admins read admin_emails" on admin_emails;
create policy "Admins read admin_emails" on admin_emails
  for select using (public.is_admin());

drop policy if exists "Admins write admin_emails" on admin_emails;
create policy "Admins write admin_emails" on admin_emails
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins read all promos" on promo_codes;
create policy "Admins read all promos" on promo_codes
  for select using (public.is_admin());

drop policy if exists "Admins write promos" on promo_codes;
create policy "Admins write promos" on promo_codes
  for all using (public.is_admin()) with check (public.is_admin());

create table if not exists weekly_offers (
  id text primary key,
  sort int not null default 0,
  active boolean not null default true,
  image_url text not null,
  tag_en text,
  tag_es text,
  title_en text not null,
  title_es text not null,
  offer_en text not null,
  offer_es text not null,
  cta_href text not null default '/order'
);

alter table weekly_offers enable row level security;

drop policy if exists "Public read active weekly offers" on weekly_offers;
create policy "Public read active weekly offers" on weekly_offers
  for select using (active = true);

drop policy if exists "Admins read all weekly offers" on weekly_offers;
create policy "Admins read all weekly offers" on weekly_offers
  for select using (public.is_admin());

drop policy if exists "Admins write weekly offers" on weekly_offers;
create policy "Admins write weekly offers" on weekly_offers
  for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'display_name',
    case when exists (
      select 1 from public.admin_emails a where lower(a.email) = lower(new.email)
    ) then 'admin' else 'customer' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.guard_profile_role()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if new.role is distinct from old.role and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on profiles;
create trigger profiles_guard_role
  before update on profiles
  for each row execute function public.guard_profile_role();

create or replace function public.grant_admin(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not admin';
  end if;
  insert into public.admin_emails (email)
  values (lower(trim(target_email)))
  on conflict (email) do nothing;
  update public.profiles p
  set role = 'admin'
  from auth.users u
  where p.id = u.id and lower(u.email) = lower(trim(target_email));
end;
$$;

revoke all on function public.grant_admin(text) from public;
grant execute on function public.grant_admin(text) to authenticated;

drop policy if exists "Admins update products" on products;
create policy "Admins update products" on products
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins insert products" on products;
create policy "Admins insert products" on products
  for insert with check (public.is_admin());

drop policy if exists "Admins delete products" on products;
create policy "Admins delete products" on products
  for delete using (public.is_admin());

drop policy if exists "Admins insert categories" on categories;
create policy "Admins insert categories" on categories
  for insert with check (public.is_admin());
drop policy if exists "Admins update categories" on categories;
create policy "Admins update categories" on categories
  for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins delete categories" on categories;
create policy "Admins delete categories" on categories
  for delete using (public.is_admin());

drop policy if exists "Admins read orders" on orders;
create policy "Admins read orders" on orders
  for select using (public.is_admin());

drop policy if exists "Admins update orders" on orders;
create policy "Admins update orders" on orders
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins delete orders" on orders;
create policy "Admins delete orders" on orders
  for delete using (public.is_admin());
drop policy if exists "Admins delete order items" on order_items;
create policy "Admins delete order items" on order_items
  for delete using (public.is_admin());
drop policy if exists "Admins delete shipments" on shipments;
create policy "Admins delete shipments" on shipments
  for delete using (public.is_admin());

alter table orders drop constraint if exists orders_status_check;
update orders set status = 'pending' where status = 'ready';
alter table orders add constraint orders_status_check
  check (status in ('pending', 'completed', 'sent', 'done', 'cancelled'));

alter table inquiries add column if not exists order_number text;

create or replace function public.cancel_own_order(order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update orders
  set status = 'cancelled'
  where id = order_id
    and user_id = auth.uid()
    and status = 'pending';
  if not found then
    raise exception 'Cannot cancel this order';
  end if;
end;
$$;

revoke all on function public.cancel_own_order(uuid) from public;
grant execute on function public.cancel_own_order(uuid) to authenticated;

alter table order_items add column if not exists name_en text;
alter table order_items add column if not exists name_es text;
update order_items oi
set name_en = p.name_en, name_es = p.name_es
from products p
where oi.product_id = p.id and oi.name_en is null;
alter table order_items alter column product_id drop not null;
alter table order_items drop constraint if exists order_items_product_id_fkey;
alter table order_items add constraint order_items_product_id_fkey
  foreign key (product_id) references products(id) on delete set null;

alter table orders add column if not exists payment_status text not null default 'paid';
alter table orders drop constraint if exists orders_payment_status_check;
alter table orders add constraint orders_payment_status_check
  check (payment_status in ('paid', 'unpaid'));
alter table orders add column if not exists square_payment_id text;
alter table orders add column if not exists square_order_id text;

drop policy if exists "Read order items" on order_items;
create policy "Read order items" on order_items
  for select using (
    public.is_admin()
    or exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
  );

drop policy if exists "Read shipments" on shipments;
create policy "Read shipments" on shipments
  for select using (
    public.is_admin()
    or exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'offer-images',
  'offer-images',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read offer images" on storage.objects;
create policy "Public read offer images" on storage.objects
  for select using (bucket_id = 'offer-images');

drop policy if exists "Admins upload offer images" on storage.objects;
create policy "Admins upload offer images" on storage.objects
  for insert with check (bucket_id = 'offer-images' and public.is_admin());

drop policy if exists "Admins update offer images" on storage.objects;
create policy "Admins update offer images" on storage.objects
  for update using (bucket_id = 'offer-images' and public.is_admin())
  with check (bucket_id = 'offer-images' and public.is_admin());

drop policy if exists "Admins delete offer images" on storage.objects;
create policy "Admins delete offer images" on storage.objects
  for delete using (bucket_id = 'offer-images' and public.is_admin());

create table if not exists site_pages (
  slug text primary key,
  body jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table site_pages enable row level security;

drop policy if exists "Public read site pages" on site_pages;
create policy "Public read site pages" on site_pages
  for select using (true);

drop policy if exists "Admins insert site pages" on site_pages;
create policy "Admins insert site pages" on site_pages
  for insert with check (public.is_admin());

drop policy if exists "Admins update site pages" on site_pages;
create policy "Admins update site pages" on site_pages
  for update using (public.is_admin()) with check (public.is_admin());

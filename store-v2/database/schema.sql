-- VAZ Store 2.0 database foundation
-- PostgreSQL
-- No secrets or provider credentials are stored here.

create type product_type as enum ('digital','physical','service');
create type product_status as enum ('draft','active','archived');
create type order_status as enum ('pending','paid','processing','fulfilled','cancelled','refunded');
create type fulfillment_status as enum ('pending','ready','fulfilled','failed');
create type payment_status as enum ('pending','authorized','paid','failed','refunded');

create table products (
  id uuid primary key,
  slug text not null unique,
  type product_type not null,
  status product_status not null default 'draft',
  name text not null,
  description text,
  price_minor bigint not null check (price_minor >= 0),
  currency char(3) not null default 'SAR',
  sku text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_assets (
  id uuid primary key,
  product_id uuid not null references products(id) on delete cascade,
  asset_type text not null,
  storage_key text not null,
  is_private boolean not null default true,
  created_at timestamptz not null default now()
);

create table customers (
  id uuid primary key,
  email text not null unique,
  name text,
  phone text,
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key,
  order_number text not null unique,
  customer_id uuid references customers(id),
  status order_status not null default 'pending',
  subtotal_minor bigint not null check (subtotal_minor >= 0),
  tax_minor bigint not null default 0 check (tax_minor >= 0),
  shipping_minor bigint not null default 0 check (shipping_minor >= 0),
  total_minor bigint not null check (total_minor >= 0),
  currency char(3) not null default 'SAR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key,
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  product_type product_type not null,
  quantity integer not null check (quantity > 0),
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  total_minor bigint not null check (total_minor >= 0)
);

create table payments (
  id uuid primary key,
  order_id uuid not null references orders(id) on delete cascade,
  provider text not null,
  provider_reference text unique,
  status payment_status not null default 'pending',
  amount_minor bigint not null check (amount_minor >= 0),
  currency char(3) not null default 'SAR',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table fulfillments (
  id uuid primary key,
  order_id uuid not null references orders(id) on delete cascade,
  type product_type not null,
  status fulfillment_status not null default 'pending',
  delivery_reference text,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create table download_grants (
  id uuid primary key,
  order_item_id uuid not null references order_items(id) on delete cascade,
  asset_id uuid not null references product_assets(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  download_count integer not null default 0,
  max_downloads integer,
  created_at timestamptz not null default now()
);

create table audit_log (
  id bigserial primary key,
  actor_type text not null,
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index orders_customer_id_idx on orders(customer_id);
create index order_items_order_id_idx on order_items(order_id);
create index payments_order_id_idx on payments(order_id);
create index fulfillments_order_id_idx on fulfillments(order_id);
create index download_grants_expires_at_idx on download_grants(expires_at);

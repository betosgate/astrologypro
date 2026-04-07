-- Enable moddatetime extension for auto-updating updated_at
CREATE EXTENSION IF NOT EXISTS moddatetime WITH SCHEMA extensions;

-- Perennial Product Categories
create table if not exists perennial_product_categories (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null default '',
  priority    integer not null default 0,
  status      text not null default 'active' check (status in ('active', 'inactive')),
  image_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger set_updated_at_perennial_product_categories
  before update on perennial_product_categories
  for each row execute function extensions.moddatetime(updated_at);

-- Perennial Products
create table if not exists perennial_products (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  description       text not null default '',
  mrp               numeric(10,2) not null default 0,
  offer_price       numeric(10,2) not null default 0,
  preorder_price    numeric(10,2) not null default 0,
  priority          integer not null default 0,
  category_id       uuid references perennial_product_categories(id) on delete set null,
  status            text not null default 'active' check (status in ('active', 'inactive')),
  main_image_url    text,
  details_image_url text,
  is_visible        boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger set_updated_at_perennial_products
  before update on perennial_products
  for each row execute function extensions.moddatetime(updated_at);

-- Indexes
create index idx_perennial_products_category on perennial_products(category_id);
create index idx_perennial_products_status   on perennial_products(status);
create index idx_perennial_products_priority on perennial_products(priority desc, id);
create index idx_perennial_product_categories_priority on perennial_product_categories(priority desc, id);

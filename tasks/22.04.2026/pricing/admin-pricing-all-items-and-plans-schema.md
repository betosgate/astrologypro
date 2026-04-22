# Admin Pricing `All Items & Plans` — Data Source And Schema

## Route

- `/admin/pricing`

## UI Section

- `All Items & Plans`

## Data Source

This section is not coming from a single table. It is built from:

1. `global_pricing`
2. `pricing_plans`

## How The Page Loads Data

Relevant files:

- `src/app/admin/pricing/page.tsx`
- `src/app/api/admin/pricing/route.ts`
- `src/app/api/admin/pricing/[id]/plans/route.ts`

### Main item list

The page first calls:

- `GET /api/admin/pricing`

That API queries:

- `global_pricing`

and also includes a nested select for:

- `pricing_plans`

Query shape from the route:

```ts
.from("global_pricing")
.select("id, item_key, item_name, description, html_description, is_active, stripe_product_id, stripe_product_name, payment_provider, payment_provider_id, created_at, updated_at, pricing_plans(id, display_name, amount, onetime_amount, currency, is_active, sort_order)")
```

### Expanded / selected plan list

When an item is expanded or selected, the page calls:

- `GET /api/admin/pricing/[id]/plans`

That API queries:

- `pricing_plans`

with:

```ts
.from("pricing_plans")
.select("*")
.eq("item_id", id)
```

## Table Relationship

- One `global_pricing` row = one pricing item
- One `pricing_plans` row = one plan under that item
- Relationship:

```text
pricing_plans.item_id -> global_pricing.id
```

## Current Table Structure

## 1. `global_pricing`

Purpose:

- stores the top-level pricing item
- acts like the parent record for one or more plans

Current structure:

- `id uuid primary key`
- `item_key text unique not null`
- `item_name text not null`
- `description text null`
- `html_description text null`
- `is_active boolean not null default true`
- `stripe_product_id text null`
- `stripe_product_name text null`
- `payment_provider text null/default 'stripe'`
- `payment_provider_id text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Important note:

- `price` and `currency` existed earlier on this table
- they were later removed
- item-level pricing now lives in `pricing_plans`

## 2. `pricing_plans`

Purpose:

- stores actual purchasable plans under a pricing item
- supports one-time, recurring, Stripe-linked, and admin-defined plan metadata

Current structure:

- `id uuid primary key`
- `plan_id text unique not null`
- `item_id uuid not null references global_pricing(id) on delete cascade`
- `display_name text not null`
- `amount numeric(12,2) not null default 0`
- `mrp numeric(12,2) null`
- `currency text not null`
- `stripe_price_id text null`
- `stripe_price_name text null`
- `description text null`
- `html_description text null`
- `is_active boolean not null default true`
- `sort_order int not null default 0`
- `custom_fields jsonb not null default []`
- `onetime_amount numeric(12,2) null`
- `onetime_currency text null`
- `recurring_amount numeric(12,2) null`
- `recurring_currency text null`
- `recurring_interval text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

## Meaning Of Important Fields

### `global_pricing`

- `item_key`: stable internal key used by code and APIs
- `item_name`: admin-facing/public display name of the pricing item
- `html_description`: rich text description shown on pricing-related pages
- `stripe_product_id`: Stripe product linked to the item
- `payment_provider` / `payment_provider_id`: payment account source metadata

### `pricing_plans`

- `display_name`: visible plan name
- `amount`: legacy/general amount field still kept for compatibility
- `mrp`: reference or crossed price
- `onetime_amount`: one-time payment amount
- `recurring_amount`: subscription amount
- `recurring_interval`: billing cycle such as `month` or `year`
- `stripe_price_id`: Stripe price backing the plan
- `stripe_price_name`: Stripe-side nickname/name
- `custom_fields`: flexible metadata array like:

```json
[
  { "label": "Duration", "value": "12 months", "slug": "duration" },
  { "label": "Support", "value": "Community access", "slug": "support" }
]
```

## What `All Items & Plans` Displays

### Parent item row data

Mostly from:

- `global_pricing`

Examples:

- item key
- item name
- active/inactive status
- product/payment metadata

### Nested plan rows

From:

- `pricing_plans`

Examples:

- plan name
- one-time amount
- recurring amount
- MRP
- Stripe price
- active/inactive state
- sort order
- custom fields

## Schema Migration Sources

These files define the structure evolution:

- `src/data/migrations/20260408000112_global_pricing.ts`
- `src/data/migrations/20260409000119_pricing_plans.ts`
- `src/data/migrations/20260409000120_pricing_plan_custom_fields.ts`
- `src/data/migrations/20260409000122_drop_item_price_currency.ts`
- `src/data/migrations/20260409000123_stripe_product_price_fields.ts`
- `src/data/migrations/20260410000124_pricing_onetime_recurring_html.ts`
- `src/data/migrations/20260410000125_pricing_recurring_interval.ts`

## Summary

The `All Items & Plans` section in `/admin/pricing` is built from a parent-child pricing model:

- parent table: `global_pricing`
- child table: `pricing_plans`

So if you want to understand or change what appears there:

- edit `global_pricing` for item-level records
- edit `pricing_plans` for the actual plan rows under each item

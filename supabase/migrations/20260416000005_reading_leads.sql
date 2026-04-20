-- Reading leads: qualified prospects from landing page forms
-- Captures birth details (astrology) or question (tarot) alongside contact info

create table if not exists reading_leads (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  name          text,
  life_area     text,                -- e.g. "Career & Life Purpose"
  service_type  text,                -- 'astrology' | 'tarot'
  service_name  text,                -- e.g. "Saturn Return Reading"
  birth_date    date,                -- astrology only
  birth_time    text,                -- astrology only, HH:MM
  birth_place   text,                -- astrology only, city + country
  question      text,                -- tarot question or astrology note
  source_url    text,                -- landing page URL
  created_at    timestamptz not null default now()
);

-- Index for admin lookups by email and service
create index if not exists idx_reading_leads_email       on reading_leads (email);
create index if not exists idx_reading_leads_service_type on reading_leads (service_type);
create index if not exists idx_reading_leads_created_at   on reading_leads (created_at desc);

-- RLS: only service role (admin client) can read/write
alter table reading_leads enable row level security;

create policy "Service role full access"
  on reading_leads
  for all
  to service_role
  using (true)
  with check (true);

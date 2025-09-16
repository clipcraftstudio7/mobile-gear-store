-- Affiliates core tables
create table if not exists public.affiliates (
  id bigserial primary key,
  code text unique not null,
  full_name text,
  email text,
  status text default 'active', -- active|paused
  default_rate numeric(6,4) default 0.1000,
  created_at timestamptz default now()
);

create table if not exists public.affiliates_applications (
  id bigserial primary key,
  full_name text not null,
  email text not null,
  social_handle text not null,
  audience_size text,
  website text,
  promo_plan text not null,
  preferred_code text,
  status text default 'pending', -- pending|approved|rejected
  reject_reason text,
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

-- Optional index
create index if not exists idx_affiliates_email on public.affiliates (email);

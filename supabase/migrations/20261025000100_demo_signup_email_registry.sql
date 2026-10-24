-- Stores email addresses claimed by the local demo signup flow so duplicate checks work across browsers.
create table if not exists public.demo_signup_email_registry (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

alter table public.demo_signup_email_registry enable row level security;
revoke all on public.demo_signup_email_registry from anon, authenticated;

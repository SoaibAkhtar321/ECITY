-- 0001_profiles.sql
-- FCity Phase 1: extensions, shared helpers, profiles table, roles.
--
-- Design notes:
-- * Roles live in `profiles`, one row per auth.users row (id = auth.users.id).
--   The app must NEVER trust a role sent from the client — every RLS policy
--   below re-derives the caller's role from this table via `current_role_is()`.
-- * Passwords are never stored here or anywhere in the app schema. All
--   credential handling is Supabase Auth's job (auth.users).

create extension if not exists "pgcrypto";

-- Generic updated_at trigger, reused by every table below.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create type user_role as enum ('buyer', 'seller', 'admin');

create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        user_role not null default 'buyer',
  full_name   text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table profiles is
  'One row per authenticated user. role is the single source of truth for '
  'authorization — RLS policies read it via current_role_is(), the client '
  'never supplies it.';

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Auto-create a profile (default role: buyer) whenever a new auth.users row
-- appears, so the app never has to remember to do this in two places.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Helper used by every RLS policy in later migrations. security definer so it
-- can read `profiles` even from a policy context where the querying role
-- itself has restricted access to profiles.
-- ---------------------------------------------------------------------------
create or replace function current_role_is(target_role user_role)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = target_role
  );
$$;

create or replace function current_user_role()
returns user_role
language sql
stable
security definer set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

alter table profiles enable row level security;

-- IMPORTANT: profiles.phone is treated as sensitive (it's how a buyer would
-- bypass FCity and contact a seller directly), so the base table is NOT
-- publicly readable. Anonymous/other users only ever see it through the
-- `public_profiles` view below, which deliberately omits phone.

create policy "users can read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "admins can read all profiles"
  on profiles for select
  using (current_role_is('admin'));

-- Public-safe subset for displaying e.g. a seller's name on a listing card.
-- Uses security_invoker so it still respects the caller's own RLS grants
-- for anything beyond what it selects, and simply never selects `phone`.
create view public_profiles
  with (security_invoker = true) as
  select id, full_name, avatar_url, role
  from profiles;

grant select on public_profiles to anon, authenticated;

create policy "users can update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from profiles where id = auth.uid()));
  -- the `with check` clause blocks a user from changing their own role via
  -- a normal update — role changes must go through an admin-only path
  -- (see migration 0006 for the admin RPC).

create policy "admins can update any profile"
  on profiles for update
  using (current_role_is('admin'));

-- Row creation is handled by the on_auth_user_created trigger (security
-- definer), so no INSERT policy is granted to normal roles.
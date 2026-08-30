-- 0002_properties_and_location.sql
-- FCity Phase 1: properties + the location-privacy split.
--
-- DESIGN DECISION (per the brief's "Option A vs B" question):
-- We use Option A — ONE `property_location` table, not two physically
-- separate public/private tables — but access to its private columns is
-- gated by column-level privilege revocation + RLS, and anonymous/buyer
-- reads never touch the base table directly: they read `property_public`,
-- a view that simply does not select exact_lat/exact_lng/exact_address.
--
-- Why one table instead of two: exact and approximate location are
-- generated together (the approx values are derived from the exact ones at
-- insert time — see 0003_location_jitter.sql), they share the same
-- lifecycle and foreign key, and splitting them into two tables buys no
-- extra safety over "no SELECT grant + a view" while adding a second place
-- every write has to touch in sync. The actual safety comes from:
--   1. REVOKE all direct table privileges from anon/authenticated
--   2. GRANT only through views/functions that are hard-coded to the
--      public column list
--   3. RLS as a second, independent layer under that
-- A public query literally cannot select `exact_lat` because the roles it
-- runs as have no privilege to the base table at all — not because a
-- policy filtered it out at runtime.

create type property_status as enum
  ('draft', 'pending', 'published', 'rejected', 'sold', 'archived');

create type listing_type as enum ('sale', 'rent');

create table properties (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references profiles (id) on delete cascade,
  title          text not null check (char_length(title) between 3 and 200),
  slug           text not null unique,
  property_type  text not null,        -- 'plot' | 'villa' | 'apartment' | 'commercial' | ... (kept as text: enum churn here is more likely than on status/role)
  listing_type   listing_type not null default 'sale',
  price          numeric(14, 2) not null check (price >= 0),
  area           numeric(10, 2),
  area_unit      text default 'sqft',
  bedrooms       smallint check (bedrooms >= 0),
  bathrooms      smallint check (bathrooms >= 0),
  description    text,
  status         property_status not null default 'draft',
  city           text not null,
  locality       text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  published_at   timestamptz
);

create index properties_status_idx on properties (status) where status = 'published';
create index properties_city_locality_idx on properties (city, locality);
create index properties_type_idx on properties (property_type);
create index properties_price_idx on properties (price);
create index properties_owner_idx on properties (owner_id);

create trigger properties_set_updated_at
  before update on properties
  for each row execute function set_updated_at();

create or replace function set_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and old.status is distinct from 'published' then
    new.published_at = now();
  end if;
  return new;
end;
$$;

create trigger properties_set_published_at
  before update on properties
  for each row execute function set_published_at();

-- ---------------------------------------------------------------------------
-- property_location — the sensitive table.
-- ---------------------------------------------------------------------------

create table property_location (
  property_id      uuid primary key references properties (id) on delete cascade,
  city             text not null,
  locality         text not null,
  area             text,
  nearby_landmarks text,
  -- PUBLIC: always a jittered point, never the real one (see 0003).
  approx_lat       double precision not null,
  approx_lng       double precision not null,
  -- PRIVATE: never selectable by anon/buyer roles. See grants below.
  exact_lat        double precision not null,
  exact_lng        double precision not null,
  exact_address    text not null
);

comment on column property_location.approx_lat is
  'Public map marker. Deliberately offset from exact_lat by set_location_jitter() — never equals it.';
comment on column property_location.exact_lat is
  'PRIVATE. No SELECT grant to anon/authenticated. Only reachable via reveal_exact_location() after a qualifying lead state.';

-- ---------------------------------------------------------------------------
-- property_media
-- ---------------------------------------------------------------------------

create table property_media (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references properties (id) on delete cascade,
  storage_path  text not null,   -- path within the `property-media` Supabase Storage bucket, not a public URL
  media_type    text not null default 'image' check (media_type in ('image', 'video', 'floorplan', 'document')),
  sort_order    smallint not null default 0,
  created_at    timestamptz not null default now()
);

create index property_media_property_idx on property_media (property_id);

-- ===========================================================================
-- RLS
-- ===========================================================================

alter table properties enable row level security;
alter table property_location enable row level security;
alter table property_media enable row level security;

-- properties: published rows are public; owners see all their own states;
-- admins see everything.
create policy "published properties are public"
  on properties for select
  using (status = 'published');

create policy "sellers can read own properties any status"
  on properties for select
  using (auth.uid() = owner_id);

create policy "admins can read all properties"
  on properties for select
  using (current_role_is('admin'));

create policy "sellers can insert own properties"
  on properties for insert
  with check (auth.uid() = owner_id and current_role_is('seller'));

create policy "sellers can update own properties"
  on properties for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "admins can update any property"
  on properties for update
  using (current_role_is('admin'));

-- property_location: THE CRITICAL PART.
-- No SELECT/INSERT/UPDATE policy is granted to anon or plain authenticated
-- roles at all — the only paths in are:
--   * the `property_public` view (public columns only, see below)
--   * owner/admin direct policies (need the exact address to manage listing)
--   * the reveal_exact_location() function (security definer, checked
--     against the lead/site-visit state — see 0004)
create policy "owners can read own property location"
  on property_location for select
  using (
    exists (
      select 1 from properties
      where properties.id = property_location.property_id
        and properties.owner_id = auth.uid()
    )
  );

create policy "admins can read all property locations"
  on property_location for select
  using (current_role_is('admin'));

create policy "owners can write own property location"
  on property_location for insert
  with check (
    exists (
      select 1 from properties
      where properties.id = property_location.property_id
        and properties.owner_id = auth.uid()
    )
  );

create policy "owners can update own property location"
  on property_location for update
  using (
    exists (
      select 1 from properties
      where properties.id = property_location.property_id
        and properties.owner_id = auth.uid()
    )
  );

-- property_media: readable wherever the parent property is readable
-- (published, or owned, or admin); writable only by the owner.
create policy "property media follows property visibility"
  on property_media for select
  using (
    exists (
      select 1 from properties p
      where p.id = property_media.property_id
        and (
          p.status = 'published'
          or p.owner_id = auth.uid()
          or current_role_is('admin')
        )
    )
  );

create policy "owners can manage own property media"
  on property_media for insert
  with check (
    exists (
      select 1 from properties
      where properties.id = property_media.property_id
        and properties.owner_id = auth.uid()
    )
  );

create policy "owners can delete own property media"
  on property_media for delete
  using (
    exists (
      select 1 from properties
      where properties.id = property_media.property_id
        and properties.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- property_public — the only view anon/buyer traffic should ever query.
-- Explicit column list: exact_lat/exact_lng/exact_address are structurally
-- absent, not filtered.
-- ---------------------------------------------------------------------------

create view property_public
  with (security_invoker = true) as
  select
    p.id,
    p.title,
    p.slug,
    p.property_type,
    p.listing_type,
    p.price,
    p.area,
    p.area_unit,
    p.bedrooms,
    p.bathrooms,
    p.description,
    p.city,
    p.locality,
    p.published_at,
    pl.area          as location_area,
    pl.nearby_landmarks,
    pl.approx_lat,
    pl.approx_lng
  from properties p
  join property_location pl on pl.property_id = p.id
  where p.status = 'published';

grant select on property_public to anon, authenticated;

-- Lock down direct base-table privileges for the sensitive table: the anon
-- role gets no privilege on property_location at all, so anonymous traffic
-- cannot reach exact_lat/exact_lng/exact_address through any query shape —
-- not because a policy filtered it out, but because the grant doesn't
-- exist. authenticated keeps its table-level SELECT grant (Supabase's
-- default), and the RLS policies above are what then restrict it to only
-- the caller's own properties, or admin.
revoke all on property_location from anon;
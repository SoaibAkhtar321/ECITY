-- 0004_leads_site_visits_reveals.sql
-- FCity Phase 1: the buyer-intent + anti-bypass reveal chain.

create type lead_status as enum
  ('new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'closed', 'lost');

create type site_visit_status as enum
  ('requested', 'confirmed', 'completed', 'cancelled', 'no_show');

create table leads (
  id           uuid primary key default gen_random_uuid(),
  buyer_id     uuid not null references profiles (id) on delete cascade,
  property_id  uuid not null references properties (id) on delete cascade,
  status       lead_status not null default 'new',
  source       text default 'website',
  message      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (buyer_id, property_id)   -- one active lead per buyer per property; re-inquiring updates the existing row
);

create index leads_buyer_idx on leads (buyer_id);
create index leads_property_idx on leads (property_id);
create index leads_status_idx on leads (status);

create trigger leads_set_updated_at
  before update on leads
  for each row execute function set_updated_at();

create table site_visits (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references leads (id) on delete cascade,
  scheduled_at  timestamptz,
  status        site_visit_status not null default 'requested',
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index site_visits_lead_idx on site_visits (lead_id);

create trigger site_visits_set_updated_at
  before update on site_visits
  for each row execute function set_updated_at();

-- Audit trail: every time reveal_exact_location() successfully returns
-- data, it logs itself here first. This table has no client-writable path
-- at all — the only writer is the security definer function below.
create table seller_contact_reveals (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references leads (id) on delete cascade,
  revealed_to  uuid not null references profiles (id),
  revealed_at  timestamptz not null default now(),
  reason       text not null,
  metadata     jsonb
);

create index seller_contact_reveals_lead_idx on seller_contact_reveals (lead_id);

-- ===========================================================================
-- RLS
-- ===========================================================================

alter table leads enable row level security;
alter table site_visits enable row level security;
alter table seller_contact_reveals enable row level security;

create policy "buyers can read own leads"
  on leads for select
  using (auth.uid() = buyer_id);

create policy "sellers can read leads on own properties"
  on leads for select
  using (
    exists (
      select 1 from properties
      where properties.id = leads.property_id
        and properties.owner_id = auth.uid()
    )
  );

create policy "admins can read all leads"
  on leads for select
  using (current_role_is('admin'));

create policy "buyers can create own leads"
  on leads for insert
  with check (auth.uid() = buyer_id and current_role_is('buyer'));

create policy "sellers can update status on own-property leads"
  on leads for update
  using (
    exists (
      select 1 from properties
      where properties.id = leads.property_id
        and properties.owner_id = auth.uid()
    )
  );

create policy "admins can update any lead"
  on leads for update
  using (current_role_is('admin'));

-- site_visits: visibility follows the parent lead's visibility.
create policy "site visits follow lead visibility"
  on site_visits for select
  using (
    exists (
      select 1 from leads l
      where l.id = site_visits.lead_id
        and (
          l.buyer_id = auth.uid()
          or exists (
            select 1 from properties p
            where p.id = l.property_id and p.owner_id = auth.uid()
          )
          or current_role_is('admin')
        )
    )
  );

create policy "buyers can request a site visit on own lead"
  on site_visits for insert
  with check (
    exists (
      select 1 from leads where leads.id = site_visits.lead_id and leads.buyer_id = auth.uid()
    )
  );

create policy "sellers can update site visits on own-property leads"
  on site_visits for update
  using (
    exists (
      select 1 from leads l
      join properties p on p.id = l.property_id
      where l.id = site_visits.lead_id and p.owner_id = auth.uid()
    )
  );

create policy "admins can manage all site visits"
  on site_visits for all
  using (current_role_is('admin'));

-- seller_contact_reveals: read-only, and only to the parties involved or admin.
create policy "reveal log readable by involved parties"
  on seller_contact_reveals for select
  using (
    revealed_to = auth.uid()
    or current_role_is('admin')
    or exists (
      select 1 from leads l
      join properties p on p.id = l.property_id
      where l.id = seller_contact_reveals.lead_id and p.owner_id = auth.uid()
    )
  );
-- No INSERT/UPDATE/DELETE policy for any non-admin role: the only writer is
-- reveal_exact_location() below, which runs as security definer.

-- ===========================================================================
-- THE CONTROLLED REVEAL PATH
-- ===========================================================================
--
-- This is the only function in the schema allowed to hand exact_lat/
-- exact_lng/exact_address to a buyer. It is security definer (so it can
-- read property_location despite the caller having no table grant on it),
-- but it independently re-derives every permission check itself — it does
-- not trust anything the client passed in except the lead_id.

create or replace function reveal_exact_location(p_lead_id uuid)
returns table (
  exact_lat double precision,
  exact_lng double precision,
  exact_address text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id    uuid;
  v_property_id uuid;
  v_lead_status lead_status;
  v_visit_ok    boolean;
begin
  select l.buyer_id, l.property_id, l.status
    into v_buyer_id, v_property_id, v_lead_status
  from leads l
  where l.id = p_lead_id;

  if v_buyer_id is null then
    raise exception 'lead not found';
  end if;

  -- Only the buyer on this exact lead (or an admin) may call this.
  if auth.uid() <> v_buyer_id and not current_role_is('admin') then
    raise exception 'not authorized to reveal location for this lead';
  end if;

  -- Business rule: exact location only unlocks once a site visit has been
  -- confirmed (or the lead has progressed past that point). Admins bypass
  -- this for support purposes.
  select exists (
    select 1 from site_visits sv
    where sv.lead_id = p_lead_id
      and sv.status in ('confirmed', 'completed')
  ) into v_visit_ok;

  if not (v_visit_ok or v_lead_status in ('negotiation', 'closed') or current_role_is('admin')) then
    raise exception 'location is not yet available for this lead';
  end if;

  insert into seller_contact_reveals (lead_id, revealed_to, reason)
  values (p_lead_id, auth.uid(), 'site_visit_confirmed_or_admin');

  return query
    select pl.exact_lat, pl.exact_lng, pl.exact_address
    from property_location pl
    where pl.property_id = v_property_id;
end;
$$;

revoke all on function reveal_exact_location(uuid) from public;
grant execute on function reveal_exact_location(uuid) to authenticated;
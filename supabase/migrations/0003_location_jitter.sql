-- 0003_location_jitter.sql
-- FCity Phase 1: server-side generation of the public approximate marker.
--
-- Requirement from the brief: approx_lat/approx_lng must not be trivially
-- reversible back to exact_lat/exact_lng, and the offset logic itself must
-- not be exposed to anonymous users. Concretely:
--   * The client (seller UI) only ever sends exact_lat/exact_lng.
--   * approx_lat/approx_lng are computed by this trigger, server-side, at
--     INSERT/UPDATE time — the seller's own client never even computes or
--     sees the offset math run.
--   * The function is NOT security definer and is not exposed as an RPC —
--     it only runs as a trigger, so there is nothing for a client to call
--     directly to learn the offset for a coordinate of their choosing.
--   * Offset is randomized per property (150-500m, random bearing) rather
--     than a fixed formula, so seeing many public markers over time does
--     not reveal a consistent transform to back out the exact point.

create or replace function apply_location_jitter()
returns trigger
language plpgsql
as $$
declare
  radius_m   double precision := 150 + random() * 350;   -- 150m..500m
  bearing    double precision := random() * 2 * pi();     -- random direction
  earth_r    double precision := 6371000;                 -- meters
  d_lat      double precision;
  d_lng      double precision;
begin
  d_lat := (radius_m * cos(bearing)) / earth_r;
  d_lng := (radius_m * sin(bearing)) / (earth_r * cos(radians(new.exact_lat)));

  new.approx_lat := new.exact_lat + degrees(d_lat);
  new.approx_lng := new.exact_lng + degrees(d_lng);

  return new;
end;
$$;

comment on function apply_location_jitter is
  'Computes a random 150-500m offset marker server-side. Runs only as a '
  'BEFORE INSERT/UPDATE OF exact_lat, exact_lng trigger — deliberately not '
  'exposed as a callable RPC, so no client can probe it with arbitrary '
  'coordinates to learn the offset distribution.';

create trigger property_location_apply_jitter
  before insert or update of exact_lat, exact_lng on property_location
  for each row execute function apply_location_jitter();
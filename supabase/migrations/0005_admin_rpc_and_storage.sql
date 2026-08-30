-- 0005_admin_rpc_and_storage.sql
-- FCity Phase 1: the one legitimate path to change a user's role, and the
-- Storage bucket property_media.storage_path refers to.

-- ---------------------------------------------------------------------------
-- Role changes: admin-only, explicit function — not a raw UPDATE policy.
-- The `profiles` UPDATE policy in 0001 already blocks a user from changing
-- their own role; this function is how an admin actually promotes/demotes
-- someone (e.g. buyer -> seller after seller verification).
-- ---------------------------------------------------------------------------

create or replace function admin_set_user_role(target_user_id uuid, new_role user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not current_role_is('admin') then
    raise exception 'only admins can change roles';
  end if;

  update profiles set role = new_role where id = target_user_id;
end;
$$;

revoke all on function admin_set_user_role(uuid, user_role) from public;
grant execute on function admin_set_user_role(uuid, user_role) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: property media bucket.
-- Bucket itself is created via the Supabase dashboard/CLI (storage buckets
-- aren't SQL objects in the same sense), but the RLS-equivalent policies on
-- storage.objects are plain SQL and belong in migrations like any other
-- policy. Path convention: {property_id}/{filename}, matching
-- property_media.storage_path.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('property-media', 'property-media', true)
on conflict (id) do nothing;

-- Public read: fine, because only published-property media should end up
-- referenced from the public UI in the first place (enforced by the
-- property_media RLS policy in 0002, which is what the app actually queries
-- to decide which storage_paths to even render).
create policy "public read of property media objects"
  on storage.objects for select
  using (bucket_id = 'property-media');

-- Write access: only the owning seller, path-scoped by property_id as the
-- first path segment.
create policy "sellers can upload media for own properties"
  on storage.objects for insert
  with check (
    bucket_id = 'property-media'
    and exists (
      select 1 from properties
      where properties.id::text = (storage.foldername(name))[1]
        and properties.owner_id = auth.uid()
    )
  );

create policy "sellers can delete media for own properties"
  on storage.objects for delete
  using (
    bucket_id = 'property-media'
    and exists (
      select 1 from properties
      where properties.id::text = (storage.foldername(name))[1]
        and properties.owner_id = auth.uid()
    )
  );
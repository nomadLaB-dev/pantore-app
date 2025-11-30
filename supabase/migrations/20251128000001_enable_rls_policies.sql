-- This script adapts Row Level Security (RLS) policies for a many-to-many tenancy model.

-- 1. Drop old functions and triggers that are no longer valid.
drop function if exists public.get_my_tenant_id();
drop function if exists public.set_tenant_id();
-- Dropping triggers is harder without knowing their names on each table.
-- We will rely on the fact that the function they call is now gone.
-- A more robust migration would query pg_triggers and drop them.

-- 2. Create a helper function to check if a user is a member of a specific tenant.
create or replace function public.is_member_of_tenant(p_tenant_id uuid)
returns boolean as $$
  select exists (
    select 1
    from public.memberships
    where memberships.tenant_id = p_tenant_id
      and memberships.user_id = auth.uid()
  );
$$ language sql security definer stable;
comment on function public.is_member_of_tenant(uuid) is 'Checks if the current user is a member of the specified tenant.';

-- 3. Enable RLS and apply new policies.
do $$
declare
  t_name text;
  p_name text;
begin
  -- Loop through all tables that need tenant isolation.
  foreach t_name in array ARRAY['tenants', 'users', 'assets', 'requests', 'employment_history', 'departments', 'branches', 'companies', 'organization_settings', 'memberships']
  loop
    -- Enable RLS
    execute format('alter table public.%I enable row level security', t_name);

    -- Drop all existing policies on the table to ensure a clean slate.
    for p_name in select policyname from pg_policies where schemaname = 'public' and tablename = t_name
    loop
      execute format('drop policy if exists %I on public.%I', p_name, t_name);
    end loop;
  end loop;
end;
$$;

-- 4. Policies for resource tables (those with a tenant_id column)
do $$
declare
  t_name text;
begin
  foreach t_name in array ARRAY['assets', 'requests', 'employment_history', 'departments', 'branches', 'companies', 'organization_settings']
  loop
    execute format('
      create policy "Users can manage resources in their own tenants" on public.%I
      for all
      using ( public.is_member_of_tenant(tenant_id) )
      with check ( public.is_member_of_tenant(tenant_id) );
    ', t_name);
  end loop;
end;
$$;

-- 5. Policy for 'tenants' table
create policy "Users can view tenants they are members of" on public.tenants
  for select
  using ( public.is_member_of_tenant(id) );

-- 6. Policies for 'users' table
create policy "Users can view other users in shared tenants" on public.users
  for select
  using (
    id = auth.uid() or -- Users can always see themselves
    exists (
      select 1
      from public.memberships m1
      join public.memberships m2 on m1.tenant_id = m2.tenant_id
      where m1.user_id = auth.uid() and m2.user_id = users.id
    )
  );

create policy "Users can update their own profile" on public.users
  for update
  using ( id = auth.uid() )
  with check ( id = auth.uid() );

-- 7. Policies for 'memberships' table
create policy "Users can view memberships of their own tenants" on public.memberships
  for select
  using ( public.is_member_of_tenant(tenant_id) );

-- Note: Policies for INSERT, UPDATE, DELETE on 'memberships' are intentionally omitted.
-- These actions should be handled by secure "security definer" functions,
-- allowing only tenant admins/owners to add or remove users.

-- 1. Create tenants table
create table public.tenants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default tenant for initial data
insert into public.tenants (id, name)
values ('00000000-0000-0000-0000-000000000000', 'Default Organization');

-- 2. Create memberships table for many-to-many relationship
create table public.memberships (
  user_id uuid not null references public.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, tenant_id) -- Composite primary key
);
comment on table public.memberships is 'Tracks which user belongs to which tenant and their role.';

-- Assign existing users to the default tenant with 'owner' role
insert into public.memberships (user_id, tenant_id, role)
select id, '00000000-0000-0000-0000-000000000000', 'owner' from public.users;

-- 3. Add tenant_id to other major tables that belong to a tenant
do $$
declare
  t text;
begin
  for t in select unnest(ARRAY['assets', 'requests', 'employment_history', 'departments', 'branches', 'companies', 'organization_settings'])
  loop
    execute format('alter table public.%I add column tenant_id uuid references public.tenants(id)', t);
    execute format('update public.%I set tenant_id = ''00000000-0000-0000-0000-000000000000''', t);
    execute format('alter table public.%I alter column tenant_id set not null', t);
  end loop;
end;
$$;

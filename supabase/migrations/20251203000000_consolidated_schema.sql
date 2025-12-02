-- Consolidated Schema Migration
-- Combines all previous migrations into a single file for a clean state.

-- 1. Extensions
create extension if not exists moddatetime with schema extensions;

-- 2. Types
create type public.join_request_status as enum ('pending', 'approved', 'rejected');

-- 3. Tables

-- Tenants Table
create table public.tenants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  domain text unique, -- Added in 20251129000001
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on column public.tenants.domain is 'The email domain associated with this tenant, for auto-join suggestions.';

-- Insert default tenant for initial data (Optional, but good for dev)
insert into public.tenants (id, name)
values ('00000000-0000-0000-0000-000000000000', 'Default Organization')
on conflict do nothing;

-- Users Table (extends auth.users)
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  name text,
  role text check (role in ('owner', 'admin', 'manager', 'user')), -- Legacy role column, now handled by memberships
  company text,
  department text,
  status text check (status in ('active', 'inactive')),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Memberships Table (Many-to-Many)
create table public.memberships (
  user_id uuid not null references public.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  status text default 'active', -- Added in 20251202000000
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, tenant_id)
);
comment on table public.memberships is 'Tracks which user belongs to which tenant and their role.';

-- Assets Table
create table public.assets (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references public.tenants(id),
  management_id text,
  serial text,
  model text,
  user_id uuid references public.users(id),
  status text check (status in ('available', 'in_use', 'maintenance', 'repair', 'disposed')),
  ownership text check (ownership in ('owned', 'rental', 'lease', 'byod')),
  purchase_date date,
  contract_end_date date,
  purchase_cost integer,
  monthly_cost integer,
  months integer,
  note text,
  accessories text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Requests Table
create table public.requests (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references public.tenants(id),
  type text check (type in ('new_hire', 'breakdown', 'return')),
  user_id uuid references public.users(id),
  date date,
  status text check (status in ('pending', 'approved', 'completed', 'rejected')),
  detail text,
  note text,
  admin_note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Employment History Table
create table public.employment_history (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references public.tenants(id),
  user_id uuid references public.users(id) on delete cascade,
  start_date date not null,
  end_date date,
  company text,
  department text, -- Corrected from 'dept'
  branch text,
  position text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Master Data Tables
create table public.departments (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references public.tenants(id),
  name text not null
);

create table public.companies (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references public.tenants(id),
  name text not null
);

create table public.branches (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references public.tenants(id),
  name text not null
);

-- Organization Settings Table
create table public.organization_settings (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references public.tenants(id),
  name text,
  allowed_ownerships text[],
  contact_label text,
  contact_value text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint organization_settings_name_key unique (name),
  constraint organization_settings_tenant_id_key unique (tenant_id) -- Added in 20251201000000
);

-- Join Requests Table
create table public.join_requests (
    id uuid primary key default gen_random_uuid(),
    email text not null,
    tenant_id uuid not null references public.tenants(id) on delete cascade,
    status public.join_request_status not null default 'pending',
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);
comment on table public.join_requests is 'Records user requests to join a specific tenant.';
create trigger handle_updated_at before update on public.join_requests
  for each row execute procedure moddatetime (updated_at);


-- 4. Functions & Triggers

-- Handle New User (Trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, role, status)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    'user',
    'active'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to ensure idempotency
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Is Member Of Tenant (Helper)
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

-- Create First Tenant (RPC)
create or replace function public.create_first_tenant(
  tenant_name text,
  tenant_domain text -- The domain of the user creating the tenant. Can be null.
)
returns uuid as $$
declare
  new_tenant_id uuid;
begin
  -- Create a new tenant, optionally with a domain
  insert into public.tenants (name, domain)
  values (tenant_name, tenant_domain)
  returning id into new_tenant_id;

  -- Assign the current user as the owner of the new tenant
  insert into public.memberships (user_id, tenant_id, role)
  values (auth.uid(), new_tenant_id, 'owner');

  -- Update the user's global role to 'owner'
  update public.users
  set role = 'owner'
  where id = auth.uid();

  return new_tenant_id;
end;
$$ language plpgsql security definer;
comment on function public.create_first_tenant(text, text) is 'Creates a new tenant, optionally stamping it with a domain, and assigns the calling user as its owner.';


-- 5. RLS Policies

-- Enable RLS on all tables
alter table public.tenants enable row level security;
alter table public.users enable row level security;
alter table public.memberships enable row level security;
alter table public.assets enable row level security;
alter table public.requests enable row level security;
alter table public.employment_history enable row level security;
alter table public.departments enable row level security;
alter table public.companies enable row level security;
alter table public.branches enable row level security;
alter table public.organization_settings enable row level security;
alter table public.join_requests enable row level security;

-- Tenants
create policy "Users can view tenants they are members of" on public.tenants
  for select using ( public.is_member_of_tenant(id) );

-- Users
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

-- Memberships
create policy "Users can view memberships of their own tenants" on public.memberships
  for select
  using ( public.is_member_of_tenant(tenant_id) );
-- Note: INSERT/UPDATE/DELETE handled by admin functions or service role

-- Resource Tables (Assets, Requests, History, Master Data, Settings)
-- Policy: Users can manage resources in their own tenants
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

-- Join Requests
create policy "Tenant admins can manage join requests"
on public.join_requests for all
using (
    exists (
        select 1 from public.memberships
        where memberships.tenant_id = join_requests.tenant_id
        and memberships.user_id = auth.uid()
        and (memberships.role = 'admin' or memberships.role = 'owner')
    )
);

create policy "Users can see their own join requests"
on public.join_requests for select
using (
    auth.jwt()->>'email' = email
);

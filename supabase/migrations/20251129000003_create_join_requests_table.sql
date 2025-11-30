-- Create a specific type for the status to ensure data integrity
create type public.join_request_status as enum ('pending', 'approved', 'rejected');

-- Create the join_requests table
create table public.join_requests (
    id uuid primary key default gen_random_uuid(),
    email text not null,
    tenant_id uuid not null references public.tenants(id) on delete cascade,
    status public.join_request_status not null default 'pending',
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

comment on table public.join_requests is 'Records user requests to join a specific tenant.';

-- Add a trigger to update the updated_at timestamp
create trigger handle_updated_at before update on public.join_requests
  for each row execute procedure moddatetime (updated_at);

-- Enable RLS for the new table
alter table public.join_requests enable row level security;

-- RLS Policies for join_requests:
-- 1. Tenant admins/owners can view and manage requests for their tenant.
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

-- 2. Users can see their own join requests.
create policy "Users can see their own join requests"
on public.join_requests for select
using (
    auth.jwt()->>'email' = email
);

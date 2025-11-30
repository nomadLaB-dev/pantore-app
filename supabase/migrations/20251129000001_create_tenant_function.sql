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

  return new_tenant_id;
end;
$$ language plpgsql security definer;

comment on function public.create_first_tenant(text, text) is 'Creates a new tenant, optionally stamping it with a domain, and assigns the calling user as its owner.';

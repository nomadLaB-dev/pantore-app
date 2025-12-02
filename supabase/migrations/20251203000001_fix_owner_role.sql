-- 1. Update users table constraint to allow 'owner' role
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('owner', 'admin', 'manager', 'user'));

-- 2. Update create_first_tenant function to set user role to 'owner'
CREATE OR REPLACE FUNCTION public.create_first_tenant(
  tenant_name text,
  tenant_domain text
)
RETURNS uuid AS $$
DECLARE
  new_tenant_id uuid;
BEGIN
  -- Create a new tenant, optionally with a domain
  INSERT INTO public.tenants (name, domain)
  VALUES (tenant_name, tenant_domain)
  RETURNING id INTO new_tenant_id;

  -- Assign the current user as the owner of the new tenant
  INSERT INTO public.memberships (user_id, tenant_id, role)
  VALUES (auth.uid(), new_tenant_id, 'owner');

  -- Update the user's global role to 'owner'
  UPDATE public.users
  SET role = 'owner'
  WHERE id = auth.uid();

  RETURN new_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

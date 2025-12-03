-- Add logging to debug trigger execution
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Log entry
  raise notice 'handle_new_user triggered for %', new.id;
  
  insert into public.users (id, email, name, role, status)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    'user',
    'active'
  );
  return new;
exception when others then
  -- Log error
  raise warning 'Error in handle_new_user: %', SQLERRM;
  return new;
end;
$$ language plpgsql security definer;

-- Ensure the function has permission to insert into public.users
grant insert on table public.users to postgres, service_role, authenticated, anon;
grant usage on schema public to postgres, service_role, authenticated, anon;

-- Re-create trigger just to be absolutely sure
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

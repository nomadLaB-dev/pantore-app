-- Fix trigger function qualification and search_path
-- 1. Drop existing trigger and function to start fresh
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 2. Recreate function with explicit search_path and security definer
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
$$ language plpgsql security definer set search_path = public; -- Force search_path to public

-- 3. Grant permissions explicitly
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on table public.users to postgres, anon, authenticated, service_role;

-- 4. Recreate trigger with fully qualified function name
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

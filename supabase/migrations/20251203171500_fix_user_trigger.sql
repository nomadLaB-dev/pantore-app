-- Re-create the handle_new_user function and trigger to ensure they exist and are correct.
-- This fixes the issue where public.users records were not being created for new auth users.

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

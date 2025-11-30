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

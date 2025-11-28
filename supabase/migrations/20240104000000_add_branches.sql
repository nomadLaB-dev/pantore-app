create table public.branches (
  id uuid default gen_random_uuid() primary key,
  name text not null
);

-- Enable RLS
alter table public.branches enable row level security;

-- Policies
create policy "Branches viewable by everyone." on public.branches for select using (true);
create policy "Admins can manage branches." on public.branches for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

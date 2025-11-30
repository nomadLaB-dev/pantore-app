create extension if not exists moddatetime with schema extensions;

-- Create Users table (extends auth.users)
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  name text,
  role text check (role in ('admin', 'manager', 'user')),
  company text,
  department text,
  status text check (status in ('active', 'inactive')),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.users enable row level security;

-- Create Assets table
create table public.assets (
  id uuid default gen_random_uuid() primary key,
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

-- Enable RLS
alter table public.assets enable row level security;

-- Create Requests table
create table public.requests (
  id uuid default gen_random_uuid() primary key,
  type text check (type in ('new_hire', 'breakdown', 'return')),
  user_id uuid references public.users(id),
  date date,
  status text check (status in ('pending', 'approved', 'completed', 'rejected')),
  detail text,
  note text,
  admin_note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.requests enable row level security;

-- Create Master Data tables (Simple lookup tables)
create table public.departments (
  id uuid default gen_random_uuid() primary key,
  name text not null
);

create table public.companies (
  id uuid default gen_random_uuid() primary key,
  name text not null
);

-- RLS Policies (Simple for now)
-- Users
create policy "Public profiles are viewable by everyone." on public.users for select using (true);
create policy "Users can insert their own profile." on public.users for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.users for update using (auth.uid() = id);

-- Assets
create policy "Assets are viewable by everyone." on public.assets for select using (true);
create policy "Admins can insert assets." on public.assets for insert with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
create policy "Admins can update assets." on public.assets for update using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- Requests
create policy "Requests are viewable by everyone." on public.requests for select using (true);
create policy "Users can insert their own requests." on public.requests for insert with check (auth.uid() = user_id);
create policy "Admins can update requests." on public.requests for update using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, role, status)
  values (new.id, new.email, new.raw_user_meta_data->>'name', 'user', 'active');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

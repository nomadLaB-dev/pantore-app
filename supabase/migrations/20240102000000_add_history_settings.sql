-- Create Employment History table
create table public.employment_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  start_date date not null,
  end_date date,
  company text,
  department text,
  branch text,
  position text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.employment_history enable row level security;

-- Create Settings table (Single row expected)
create table public.organization_settings (
  id uuid default gen_random_uuid() primary key,
  name text,
  allowed_ownerships text[],
  contact_label text,
  contact_value text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.organization_settings enable row level security;

-- RLS Policies

-- Employment History
create policy "Employment history viewable by everyone." on public.employment_history for select using (true);
create policy "Admins can manage employment history." on public.employment_history for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- Settings
create policy "Settings viewable by everyone." on public.organization_settings for select using (true);
create policy "Admins can update settings." on public.organization_settings for update using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
create policy "Admins can insert settings." on public.organization_settings for insert with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

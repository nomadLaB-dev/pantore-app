-- Add return_date to assets table
alter table public.assets
add column return_date date;

comment on column public.assets.return_date is 'Date when the rental/lease asset was returned.';

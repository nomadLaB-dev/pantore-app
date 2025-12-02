-- Add depreciation_months to assets table
alter table public.assets
add column depreciation_months integer;

comment on column public.assets.depreciation_months is 'Depreciation period in months for owned assets.';

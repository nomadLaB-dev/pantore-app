alter table public.tenants
add column domain text unique;

comment on column public.tenants.domain is 'The email domain associated with this tenant, for auto-join suggestions.';

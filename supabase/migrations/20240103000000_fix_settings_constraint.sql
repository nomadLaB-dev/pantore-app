-- Clean up duplicate settings first
DELETE FROM public.organization_settings
WHERE id NOT IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY updated_at DESC) as rn
    FROM public.organization_settings
  ) t
  WHERE t.rn = 1
);

-- Add unique constraint to name for upsert support
alter table public.organization_settings add constraint organization_settings_name_key unique (name);

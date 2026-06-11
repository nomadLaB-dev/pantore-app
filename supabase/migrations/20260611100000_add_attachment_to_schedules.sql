-- Add attachment columns to schedules table
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS attachment_path text;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS attachment_name text;

-- Create storage bucket for schedule attachments (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('schedule-attachments', 'schedule-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "schedule_attachments_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'schedule-attachments');

CREATE POLICY "schedule_attachments_select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'schedule-attachments');

CREATE POLICY "schedule_attachments_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'schedule-attachments');

CREATE POLICY "schedule_attachments_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'schedule-attachments');

ALTER TABLE schedules
    ADD COLUMN IF NOT EXISTS branch_available boolean;

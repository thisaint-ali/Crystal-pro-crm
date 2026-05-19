-- Add homeowner name and phone directly on jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS homeowner_name text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS homeowner_phone text;

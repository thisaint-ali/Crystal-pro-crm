-- Add latitude/longitude to jobs and leads so they show up on the map
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS longitude double precision;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS longitude double precision;

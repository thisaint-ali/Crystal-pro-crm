-- Junction table for multiple workers per job
CREATE TABLE IF NOT EXISTS job_workers (
  job_id    uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  worker_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (job_id, worker_id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_workers_job_id    ON job_workers(job_id);
CREATE INDEX IF NOT EXISTS idx_job_workers_worker_id ON job_workers(worker_id);

ALTER TABLE job_workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_workers_admin_manager_all" ON job_workers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager') AND active = true
  ));

CREATE POLICY "job_workers_worker_select" ON job_workers FOR SELECT
  USING (worker_id = auth.uid());

-- Backfill existing single-worker assignments
INSERT INTO job_workers (job_id, worker_id)
SELECT id, assigned_to FROM jobs WHERE assigned_to IS NOT NULL
ON CONFLICT DO NOTHING;

-- Update RLS on jobs so ALL assigned workers (not just primary) can see/update
DROP POLICY IF EXISTS "Workers can view their assigned jobs" ON jobs;
CREATE POLICY "Workers can view their assigned jobs" ON jobs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager') AND active = true)
    OR EXISTS (SELECT 1 FROM job_workers WHERE job_id = jobs.id AND worker_id = auth.uid())
  );

DROP POLICY IF EXISTS "Workers can update their assigned job status" ON jobs;
CREATE POLICY "Workers can update their assigned job status" ON jobs FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager') AND active = true)
    OR EXISTS (SELECT 1 FROM job_workers WHERE job_id = jobs.id AND worker_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager') AND active = true)
    OR EXISTS (SELECT 1 FROM job_workers WHERE job_id = jobs.id AND worker_id = auth.uid())
  );

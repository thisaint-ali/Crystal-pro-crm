-- ============================================================
-- MIGRATION 006: job_workers table + RLS + storage policy fixes
-- Run this entire block in the Supabase SQL editor
-- It is fully idempotent (safe to run multiple times)
-- ============================================================

-- 1. Create job_workers junction table
CREATE TABLE IF NOT EXISTS public.job_workers (
  job_id    uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  worker_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (job_id, worker_id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_workers_job_id    ON public.job_workers(job_id);
CREATE INDEX IF NOT EXISTS idx_job_workers_worker_id ON public.job_workers(worker_id);

ALTER TABLE public.job_workers ENABLE ROW LEVEL SECURITY;

-- 2. RLS policies for job_workers
DROP POLICY IF EXISTS "job_workers_admin_manager_all" ON public.job_workers;
CREATE POLICY "job_workers_admin_manager_all" ON public.job_workers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin','manager') AND active = true
  ));

DROP POLICY IF EXISTS "job_workers_worker_select" ON public.job_workers;
CREATE POLICY "job_workers_worker_select" ON public.job_workers FOR SELECT
  USING (worker_id = auth.uid());

-- 3. Backfill existing single-worker assignments
INSERT INTO public.job_workers (job_id, worker_id)
SELECT id, assigned_to FROM public.jobs WHERE assigned_to IS NOT NULL
ON CONFLICT DO NOTHING;

-- 4. Update jobs RLS so ALL assigned workers (not just primary) can see/update
DROP POLICY IF EXISTS "Workers can view their assigned jobs" ON public.jobs;
CREATE POLICY "Workers can view their assigned jobs" ON public.jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','manager') AND active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.job_workers
      WHERE job_id = public.jobs.id AND worker_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workers can update their assigned job status" ON public.jobs;
CREATE POLICY "Workers can update their assigned job status" ON public.jobs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','manager') AND active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.job_workers
      WHERE job_id = public.jobs.id AND worker_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','manager') AND active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.job_workers
      WHERE job_id = public.jobs.id AND worker_id = auth.uid()
    )
  );

-- 5. Fix storage bucket policy so secondary workers can also upload photos
DROP POLICY IF EXISTS "Workers and managers can upload job photos" ON storage.objects;
CREATE POLICY "Workers and managers can upload job photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'job-photos'
    AND auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin','manager') AND active = true
      )
      OR EXISTS (
        SELECT 1 FROM public.job_workers jw
        JOIN public.profiles p ON p.id = auth.uid()
        WHERE jw.job_id::text = split_part(name, '/', 1)
        AND jw.worker_id = auth.uid()
        AND p.role = 'worker'
        AND p.active = true
      )
    )
  );

-- 6. Fix job_photos RLS so secondary workers can also upload photos
DROP POLICY IF EXISTS "Workers can upload photos to assigned jobs" ON public.job_photos;
CREATE POLICY "Workers can upload photos to assigned jobs" ON public.job_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_photos.job_id
      AND (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role IN ('admin','manager') AND active = true
        )
        OR EXISTS (
          SELECT 1 FROM public.job_workers jw
          WHERE jw.job_id = j.id AND jw.worker_id = auth.uid()
        )
      )
    )
    AND uploaded_by = auth.uid()
  );

DROP POLICY IF EXISTS "View photos for accessible jobs" ON public.job_photos;
CREATE POLICY "View photos for accessible jobs" ON public.job_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','manager') AND active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.job_workers jw
      WHERE jw.job_id = job_photos.job_id AND jw.worker_id = auth.uid()
    )
  );

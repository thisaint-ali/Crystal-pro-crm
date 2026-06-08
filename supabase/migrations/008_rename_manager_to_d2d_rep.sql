-- Rename role 'manager' to 'd2d_rep' (Door-to-Door Sales Rep)
-- D2D rep has full manager-level access except: no delete, no settings, no payments/money

-- Step 1: Drop the existing check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Update existing rows
UPDATE public.profiles SET role = 'd2d_rep' WHERE role = 'manager';

-- Step 3: Add new check constraint
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'd2d_rep', 'technician'));

-- Step 4: Update default value
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'd2d_rep';

-- Step 5: Update RLS policies that referenced 'manager'
-- Jobs select policy
DROP POLICY IF EXISTS "Technicians can view their assigned jobs" ON public.jobs;
CREATE POLICY "Technicians can view their assigned jobs" ON public.jobs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','d2d_rep') AND active = true)
    OR assigned_to = auth.uid()
  );

-- Jobs update policy
DROP POLICY IF EXISTS "Technicians can update their assigned job status" ON public.jobs;
CREATE POLICY "Technicians can update their assigned job status" ON public.jobs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','d2d_rep') AND active = true)
    OR assigned_to = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','d2d_rep') AND active = true)
    OR assigned_to = auth.uid()
  );

-- Tasks select policy
DROP POLICY IF EXISTS "Technicians can view their assigned tasks" ON public.tasks;
CREATE POLICY "Technicians can view their assigned tasks" ON public.tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','d2d_rep') AND active = true)
    OR (assigned_to = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND active = true))
  );

DROP POLICY IF EXISTS "Technicians can complete their assigned tasks" ON public.tasks;
CREATE POLICY "Technicians can complete their assigned tasks" ON public.tasks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','d2d_rep') AND active = true)
    OR assigned_to = auth.uid()
  );

-- Notes select policy
DROP POLICY IF EXISTS "Technicians can view notes on assigned jobs" ON public.notes;
CREATE POLICY "Technicians can view notes on assigned jobs" ON public.notes
  FOR SELECT USING (
    entity_type = 'job'
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = notes.entity_id AND j.assigned_to = auth.uid()
    )
  );

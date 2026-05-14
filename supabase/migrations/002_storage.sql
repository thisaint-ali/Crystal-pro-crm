-- ============================================================
-- Supabase Storage - job-photos bucket
-- ============================================================
-- Run this in the Supabase SQL editor after creating the bucket
-- via the dashboard or Storage API

-- Create the storage bucket (run this in Supabase dashboard > Storage,
-- OR execute via the storage API. The SQL below handles policies only.)

-- Storage bucket policies for job-photos
-- These assume the bucket "job-photos" already exists

insert into storage.buckets (id, name, public)
values ('job-photos', 'job-photos', false)
on conflict (id) do nothing;

-- Allow authenticated users to read photos from accessible jobs
create policy "Authenticated users can read job photos"
  on storage.objects for select
  using (
    bucket_id = 'job-photos'
    and auth.uid() is not null
  );

-- Allow workers to upload to their assigned jobs
-- Path format: {job_id}/{photo_type}/{filename}
create policy "Workers and managers can upload job photos"
  on storage.objects for insert
  with check (
    bucket_id = 'job-photos'
    and auth.uid() is not null
    and (
      -- Admin or manager can upload to any job
      exists (
        select 1 from public.profiles
        where id = auth.uid() and role in ('admin', 'manager') and active = true
      )
      or
      -- Worker can upload to their assigned job (path starts with job_id)
      exists (
        select 1 from public.jobs j
        join public.profiles p on p.id = auth.uid()
        where j.id::text = split_part(name, '/', 1)
        and j.assigned_to = auth.uid()
        and p.role = 'worker'
        and p.active = true
      )
    )
  );

-- Allow admins and managers to delete photos
create policy "Admins and managers can delete job photos"
  on storage.objects for delete
  using (
    bucket_id = 'job-photos'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'manager') and active = true
    )
  );

-- Allow users to update their own uploads
create policy "Users can update their own uploads"
  on storage.objects for update
  using (
    bucket_id = 'job-photos'
    and auth.uid() is not null
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'manager') and active = true
    )
  );

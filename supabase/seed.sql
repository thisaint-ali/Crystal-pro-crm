-- ============================================================
-- Crystal Pro CRM - Seed Data for Testing
-- ============================================================
-- IMPORTANT: Run this AFTER creating your auth users in Supabase.
-- Replace the UUIDs below with your actual auth user IDs.
--
-- Steps:
-- 1. Create 3 users in Supabase Auth (dashboard > Authentication > Users)
--    - admin@crystalpro.test
--    - manager@crystalpro.test
--    - worker@crystalpro.test
-- 2. Copy their UUIDs and replace below
-- 3. Run this SQL in Supabase SQL editor

-- ============================================================
-- REPLACE THESE WITH REAL AUTH USER IDs
-- ============================================================
-- Example values (you must replace these):
-- Admin:   aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
-- Manager: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
-- Worker:  cccccccc-cccc-cccc-cccc-cccccccccccc

do $$
declare
  admin_id   uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; -- REPLACE
  manager_id uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'; -- REPLACE
  worker_id  uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc'; -- REPLACE

  cust1_id uuid;
  cust2_id uuid;
  cust3_id uuid;
  cust4_id uuid;
  cust5_id uuid;

  lead1_id uuid;
  lead2_id uuid;
  lead3_id uuid;

  job1_id uuid;
  job2_id uuid;
  job3_id uuid;
  job4_id uuid;
  job5_id uuid;

  quote1_id uuid;
  quote2_id uuid;
  quote3_id uuid;
begin

-- ---- Update profiles ----
update public.profiles set
  full_name = 'Alex Johnson',
  phone = '(571) 555-0001',
  role = 'admin',
  active = true
where id = admin_id;

update public.profiles set
  full_name = 'Maria Garcia',
  phone = '(571) 555-0002',
  role = 'manager',
  active = true
where id = manager_id;

update public.profiles set
  full_name = 'Chris Davis',
  phone = '(571) 555-0003',
  role = 'worker',
  active = true
where id = worker_id;

-- ---- Customers ----
insert into public.customers (id, name, phone, email, address, city, state, zip_code, customer_type, total_spent)
values
  (gen_random_uuid(), 'Robert & Karen Mitchell', '(703) 555-1001', 'rmitchell@email.com', '12847 Burke Lake Rd', 'Burke', 'VA', '22015', 'residential', 850.00),
  (gen_random_uuid(), 'James Whitfield', '(703) 555-1002', 'jwhitfield@email.com', '3421 Legato Rd', 'Fairfax', 'VA', '22033', 'residential', 600.00),
  (gen_random_uuid(), 'Susan & Tom Bradley', '(703) 555-1003', 'sbradley@email.com', '6789 Old Keene Mill Rd', 'Springfield', 'VA', '22150', 'residential', 350.00),
  (gen_random_uuid(), 'Linda Nguyen', '(571) 555-1004', 'lnguyen@email.com', '891 Columbia Pike', 'Annandale', 'VA', '22003', 'residential', 275.00),
  (gen_random_uuid(), 'Oakwood Business Park LLC', '(703) 555-1005', 'facilities@oakwoodbp.com', '2200 Old Dominion Blvd', 'Alexandria', 'VA', '22314', 'commercial', 1200.00)
returning id into cust1_id;

select id into cust1_id from public.customers where phone = '(703) 555-1001' limit 1;
select id into cust2_id from public.customers where phone = '(703) 555-1002' limit 1;
select id into cust3_id from public.customers where phone = '(703) 555-1003' limit 1;
select id into cust4_id from public.customers where phone = '(571) 555-1004' limit 1;
select id into cust5_id from public.customers where phone = '(703) 555-1005' limit 1;

-- ---- Leads ----
insert into public.leads (name, phone, email, address, city, state, zip_code, service_requested, lead_source, status, priority, assigned_to, estimated_value, notes, created_by)
values
  ('David Park', '(703) 555-2001', 'dpark@email.com', '445 Sunrise Valley Dr', 'Reston', 'VA', '20191', 'House Washing', 'google_business_profile', 'new', 'normal', manager_id, 350.00, 'Reached out via Google. Two-story house.', admin_id),
  ('Patricia Holmes', '(571) 555-2002', 'pholmes@email.com', '872 Hunter Mill Rd', 'Vienna', 'VA', '22181', 'Roof Cleaning', 'referral', 'waiting_on_photos', 'high', manager_id, 650.00, 'Referred by the Mitchells. Needs roof and gutters.', admin_id),
  ('Marcus Brown', '(703) 555-2003', null, '1156 Maple Ave', 'Herndon', 'VA', '20170', 'Driveway Cleaning', 'yard_sign', 'quote_sent', 'normal', worker_id, 200.00, 'Long driveway, two cars.', manager_id);

select id into lead1_id from public.leads where phone = '(703) 555-2001' limit 1;
select id into lead2_id from public.leads where phone = '(571) 555-2002' limit 1;
select id into lead3_id from public.leads where phone = '(703) 555-2003' limit 1;

-- ---- Quotes ----
insert into public.quotes (lead_id, service_type, description, quote_amount, discount_amount, final_amount, status, valid_until, created_by)
values
  (lead3_id, 'Driveway Cleaning', 'Single driveway approximately 1,000 sq ft. Includes rinse and seal.', 225.00, 0, 225.00, 'sent', current_date + 14, admin_id),
  (null, 'House Washing', 'Full exterior house wash, two-story colonial. Soft wash method.', 400.00, 25.00, 375.00, 'accepted', current_date + 14, manager_id),
  (null, 'Roof Cleaning', 'Asphalt shingle roof cleaning, approximately 2,000 sq ft.', 750.00, 0, 750.00, 'draft', current_date + 14, manager_id);

select id into quote1_id from public.quotes where service_type = 'Driveway Cleaning' and status = 'sent' limit 1;
select id into quote2_id from public.quotes where service_type = 'House Washing' and status = 'accepted' limit 1;
select id into quote3_id from public.quotes where service_type = 'Roof Cleaning' and status = 'draft' limit 1;

-- Link quote 2 to customer
update public.quotes set customer_id = cust2_id where id = quote2_id;

-- ---- Jobs ----
insert into public.jobs (customer_id, quote_id, service_type, address, city, state, zip_code, scheduled_date, start_time, assigned_to, price, status, payment_status, review_status, created_by)
values
  -- Roof cleaning in Burke (completed, paid)
  (cust1_id, null, 'Roof Cleaning', '12847 Burke Lake Rd', 'Burke', 'VA', '22015', current_date - 7, '08:00', worker_id, 850.00, 'completed', 'paid', 'completed', admin_id),
  -- House wash in Fairfax (completed, unpaid)
  (cust2_id, quote2_id, 'House Washing', '3421 Legato Rd', 'Fairfax', 'VA', '22033', current_date - 3, '09:00', worker_id, 375.00, 'completed', 'unpaid', 'not_requested', manager_id),
  -- Driveway cleaning in Springfield (scheduled, today)
  (cust3_id, null, 'Driveway Cleaning', '6789 Old Keene Mill Rd', 'Springfield', 'VA', '22150', current_date, '10:00', worker_id, 350.00, 'scheduled', 'unpaid', 'not_requested', admin_id),
  -- Window cleaning in Annandale (scheduled, tomorrow)
  (cust4_id, null, 'Window Cleaning', '891 Columbia Pike', 'Annandale', 'VA', '22003', current_date + 1, '08:30', worker_id, 275.00, 'scheduled', 'unpaid', 'not_requested', manager_id),
  -- Patio cleaning in Alexandria (scheduled, next week)
  (cust5_id, null, 'Commercial Pressure Washing', '2200 Old Dominion Blvd', 'Alexandria', 'VA', '22314', current_date + 5, '07:00', worker_id, 1200.00, 'scheduled', 'unpaid', 'not_requested', admin_id);

select id into job1_id from public.jobs where service_type = 'Roof Cleaning' and city = 'Burke' limit 1;
select id into job2_id from public.jobs where service_type = 'House Washing' and city = 'Fairfax' limit 1;
select id into job3_id from public.jobs where service_type = 'Driveway Cleaning' and city = 'Springfield' limit 1;

-- Update completed_at for finished jobs
update public.jobs set completed_at = now() - interval '7 days' where id = job1_id;
update public.jobs set completed_at = now() - interval '3 days' where id = job2_id;

-- ---- Tasks ----
insert into public.tasks (title, task_type, job_id, customer_id, assigned_to, due_date, status, priority, created_by)
values
  ('Collect payment - House Washing (Fairfax)', 'collect_payment', job2_id, cust2_id, manager_id, current_date, 'open', 'high', admin_id),
  ('Request Google review - Roof Cleaning (Burke)', 'request_review', job1_id, cust1_id, manager_id, current_date, 'open', 'normal', admin_id),
  ('Follow up on Driveway quote - Marcus Brown', 'follow_up', null, null, manager_id, current_date + 1, 'open', 'normal', admin_id);

-- ---- Activity Log ----
insert into public.activity_log (user_id, entity_type, entity_id, action, new_value)
values
  (admin_id, 'job', job1_id, 'job_completed', '{"status": "completed", "payment_status": "paid"}'),
  (manager_id, 'job', job2_id, 'job_completed', '{"status": "completed"}'),
  (admin_id, 'lead', lead1_id, 'lead_created', '{"name": "David Park", "status": "new"}'),
  (manager_id, 'quote', quote1_id, 'quote_sent', '{"status": "sent"}');

end $$;

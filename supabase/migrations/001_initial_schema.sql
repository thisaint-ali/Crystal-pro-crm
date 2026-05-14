-- ============================================================
-- Crystal Pro Powerwashing CRM - Initial Database Schema
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text not null default 'worker' check (role in ('admin', 'manager', 'worker')),
  avatar_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Auto-create profile when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- LEADS
-- ============================================================
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  address text,
  city text,
  state text not null default 'VA',
  zip_code text,
  service_requested text,
  lead_source text check (lead_source in (
    'website','google_business_profile','google_ads','facebook','instagram',
    'referral','yard_sign','door_hanger','repeat_customer','phone_call','other'
  )),
  status text not null default 'new' check (status in (
    'new','contacted','waiting_on_photos','estimate_needed',
    'quote_sent','follow_up_needed','booked','lost'
  )),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  assigned_to uuid references public.profiles(id) on delete set null,
  estimated_value numeric(10,2),
  notes text,
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads enable row level security;
create trigger leads_updated_at before update on public.leads for each row execute procedure public.set_updated_at();

-- ============================================================
-- CUSTOMERS
-- ============================================================
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  address text,
  city text,
  state text not null default 'VA',
  zip_code text,
  customer_type text not null default 'residential' check (customer_type in ('residential','commercial')),
  notes text,
  total_spent numeric(10,2) not null default 0,
  last_service_date date,
  created_from_lead_id uuid references public.leads(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers enable row level security;
create trigger customers_updated_at before update on public.customers for each row execute procedure public.set_updated_at();

-- ============================================================
-- QUOTES
-- ============================================================
create sequence if not exists quote_number_seq start 1;

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  quote_number text unique not null default ('CPQ-' || lpad(nextval('quote_number_seq')::text, 6, '0')),
  service_type text not null,
  description text,
  quote_amount numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  final_amount numeric(10,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','sent','accepted','declined','expired')),
  valid_until date,
  date_sent timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  follow_up_date date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quotes enable row level security;
create trigger quotes_updated_at before update on public.quotes for each row execute procedure public.set_updated_at();

-- ============================================================
-- QUOTE ITEMS
-- ============================================================
create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  service_name text,
  description text,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(10,2),
  total_price numeric(10,2),
  created_at timestamptz not null default now()
);

alter table public.quote_items enable row level security;

-- ============================================================
-- JOBS
-- ============================================================
create sequence if not exists job_number_seq start 1;

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  job_number text unique not null default ('CPJ-' || lpad(nextval('job_number_seq')::text, 6, '0')),
  service_type text not null,
  address text not null,
  city text,
  state text not null default 'VA',
  zip_code text,
  scheduled_date date,
  start_time time,
  end_time time,
  assigned_to uuid references public.profiles(id) on delete set null,
  crew_notes text,
  customer_notes text,
  internal_notes text,
  price numeric(10,2),
  status text not null default 'scheduled' check (status in ('scheduled','on_the_way','in_progress','completed','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','deposit_paid','paid','refunded')),
  review_status text not null default 'not_requested' check (review_status in ('not_requested','requested','completed')),
  completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jobs enable row level security;
create trigger jobs_updated_at before update on public.jobs for each row execute procedure public.set_updated_at();

-- ============================================================
-- JOB PHOTOS
-- ============================================================
create table public.job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  photo_url text not null,
  photo_type text not null default 'other' check (photo_type in ('before','after','damage','other')),
  caption text,
  created_at timestamptz not null default now()
);

alter table public.job_photos enable row level security;

-- ============================================================
-- PAYMENTS
-- ============================================================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  amount numeric(10,2) not null,
  payment_method text check (payment_method in (
    'cash','check','zelle','venmo','cashapp','credit_card','stripe','other'
  )),
  payment_status text default 'paid' check (payment_status in ('pending','paid','failed','refunded')),
  paid_at timestamptz,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

-- ============================================================
-- TASKS
-- ============================================================
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  task_type text check (task_type in (
    'call','text','email','follow_up','estimate','collect_payment','request_review','other'
  )),
  lead_id uuid references public.leads(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  due_date date,
  due_time time,
  status text not null default 'open' check (status in ('open','completed','cancelled')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  created_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;
create trigger tasks_updated_at before update on public.tasks for each row execute procedure public.set_updated_at();

-- ============================================================
-- NOTES
-- ============================================================
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('lead','customer','quote','job')),
  entity_id uuid not null,
  note text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.notes enable row level security;

-- ============================================================
-- ACTIVITY LOG
-- ============================================================
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

alter table public.activity_log enable row level security;

-- ============================================================
-- REVIEWS
-- ============================================================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  requested_at timestamptz,
  completed_at timestamptz,
  review_platform text not null default 'google',
  review_link text,
  status text default 'not_requested' check (status in ('not_requested','requested','completed')),
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

-- ============================================================
-- COMPANY SETTINGS
-- ============================================================
create table public.company_settings (
  id uuid primary key default gen_random_uuid(),
  company_name text default 'Crystal Pro Powerwashing',
  phone text,
  email text,
  website text default 'crystalpropowerwashing.com',
  google_review_link text,
  default_service_area text default 'Northern Virginia',
  default_quote_expiration_days integer not null default 14,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.company_settings enable row level security;
create trigger company_settings_updated_at before update on public.company_settings for each row execute procedure public.set_updated_at();

-- Insert default company settings row
insert into public.company_settings (company_name, website, default_service_area)
values ('Crystal Pro Powerwashing', 'crystalpropowerwashing.com', 'Northern Virginia');

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_leads_status on public.leads(status);
create index idx_leads_assigned_to on public.leads(assigned_to);
create index idx_leads_created_at on public.leads(created_at desc);
create index idx_leads_next_follow_up on public.leads(next_follow_up_at);

create index idx_quotes_status on public.quotes(status);
create index idx_quotes_created_at on public.quotes(created_at desc);

create index idx_jobs_status on public.jobs(status);
create index idx_jobs_assigned_to on public.jobs(assigned_to);
create index idx_jobs_scheduled_date on public.jobs(scheduled_date);
create index idx_jobs_payment_status on public.jobs(payment_status);

create index idx_tasks_assigned_to on public.tasks(assigned_to);
create index idx_tasks_due_date on public.tasks(due_date);
create index idx_tasks_status on public.tasks(status);

create index idx_customers_phone on public.customers(phone);
create index idx_customers_name on public.customers(name);

create index idx_payments_created_at on public.payments(created_at desc);
create index idx_payments_payment_status on public.payments(payment_status);

create index idx_activity_log_entity on public.activity_log(entity_type, entity_id);
create index idx_activity_log_created_at on public.activity_log(created_at desc);

create index idx_notes_entity on public.notes(entity_type, entity_id);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Helper function to get current user's role
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Helper function to check if current user is admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active = true
  );
$$;

-- Helper function to check if current user is admin or manager
create or replace function public.is_admin_or_manager()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'manager') and active = true
  );
$$;

-- ---- PROFILES RLS ----
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Admins can view all profiles" on public.profiles
  for select using (public.is_admin());

create policy "Admins and managers can view all profiles" on public.profiles
  for select using (public.is_admin_or_manager());

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- Prevent role escalation: users cannot change their own role
    and (role = (select role from public.profiles where id = auth.uid()))
  );

create policy "Admins can update any profile" on public.profiles
  for update using (public.is_admin());

create policy "Admins can insert profiles" on public.profiles
  for insert with check (public.is_admin());

-- ---- LEADS RLS ----
create policy "Admins and managers can view all leads" on public.leads
  for select using (public.is_admin_or_manager());

create policy "Admins and managers can insert leads" on public.leads
  for insert with check (public.is_admin_or_manager());

create policy "Admins and managers can update leads" on public.leads
  for update using (public.is_admin_or_manager());

create policy "Only admins can delete leads" on public.leads
  for delete using (public.is_admin());

-- ---- CUSTOMERS RLS ----
create policy "Admins and managers can view all customers" on public.customers
  for select using (public.is_admin_or_manager());

create policy "Admins and managers can insert customers" on public.customers
  for insert with check (public.is_admin_or_manager());

create policy "Admins and managers can update customers" on public.customers
  for update using (public.is_admin_or_manager());

create policy "Only admins can delete customers" on public.customers
  for delete using (public.is_admin());

-- ---- QUOTES RLS ----
create policy "Admins and managers can view all quotes" on public.quotes
  for select using (public.is_admin_or_manager());

create policy "Admins and managers can insert quotes" on public.quotes
  for insert with check (public.is_admin_or_manager());

create policy "Admins and managers can update quotes" on public.quotes
  for update using (public.is_admin_or_manager());

create policy "Only admins can delete quotes" on public.quotes
  for delete using (public.is_admin());

-- ---- QUOTE ITEMS RLS ----
create policy "Admins and managers can view quote items" on public.quote_items
  for select using (public.is_admin_or_manager());

create policy "Admins and managers can manage quote items" on public.quote_items
  for all using (public.is_admin_or_manager());

-- ---- JOBS RLS ----
-- Workers can only see jobs assigned to them
create policy "Workers can view their assigned jobs" on public.jobs
  for select using (
    public.is_admin_or_manager()
    or (
      assigned_to = auth.uid()
      and exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'worker' and active = true
      )
    )
  );

create policy "Admins and managers can insert jobs" on public.jobs
  for insert with check (public.is_admin_or_manager());

-- Workers can update status on their own jobs only
create policy "Workers can update their assigned job status" on public.jobs
  for update using (
    public.is_admin_or_manager()
    or (
      assigned_to = auth.uid()
      and exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'worker' and active = true
      )
    )
  );

create policy "Only admins can delete jobs" on public.jobs
  for delete using (public.is_admin());

-- ---- JOB PHOTOS RLS ----
-- Workers can only upload photos to jobs assigned to them
create policy "View photos for accessible jobs" on public.job_photos
  for select using (
    public.is_admin_or_manager()
    or exists (
      select 1 from public.jobs j
      where j.id = job_photos.job_id
      and (
        public.is_admin_or_manager()
        or j.assigned_to = auth.uid()
      )
    )
  );

create policy "Workers can upload to assigned jobs" on public.job_photos
  for insert with check (
    exists (
      select 1 from public.jobs j
      where j.id = job_photos.job_id
      and (
        public.is_admin_or_manager()
        or j.assigned_to = auth.uid()
      )
    )
    and uploaded_by = auth.uid()
  );

create policy "Admins and managers can delete photos" on public.job_photos
  for delete using (public.is_admin_or_manager());

-- ---- PAYMENTS RLS ----
create policy "Admins and managers can view payments" on public.payments
  for select using (public.is_admin_or_manager());

create policy "Admins and managers can insert payments" on public.payments
  for insert with check (public.is_admin_or_manager());

create policy "Admins and managers can update payments" on public.payments
  for update using (public.is_admin_or_manager());

create policy "Only admins can delete payments" on public.payments
  for delete using (public.is_admin());

-- ---- TASKS RLS ----
-- Workers can see tasks assigned to them
create policy "Workers can view their assigned tasks" on public.tasks
  for select using (
    public.is_admin_or_manager()
    or (
      assigned_to = auth.uid()
      and exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'worker' and active = true
      )
    )
  );

create policy "Admins and managers can insert tasks" on public.tasks
  for insert with check (public.is_admin_or_manager());

create policy "Workers can complete their assigned tasks" on public.tasks
  for update using (
    public.is_admin_or_manager()
    or assigned_to = auth.uid()
  );

create policy "Only admins can delete tasks" on public.tasks
  for delete using (public.is_admin());

-- ---- NOTES RLS ----
-- Workers can add notes to their assigned jobs
create policy "Admins and managers can view all notes" on public.notes
  for select using (public.is_admin_or_manager());

create policy "Workers can view notes on assigned jobs" on public.notes
  for select using (
    entity_type = 'job'
    and exists (
      select 1 from public.jobs j
      where j.id = notes.entity_id and j.assigned_to = auth.uid()
    )
  );

create policy "All authenticated users can insert notes" on public.notes
  for insert with check (auth.uid() is not null and created_by = auth.uid());

create policy "Admins and managers can delete notes" on public.notes
  for delete using (public.is_admin_or_manager());

-- ---- ACTIVITY LOG RLS ----
create policy "Admins and managers can view activity log" on public.activity_log
  for select using (public.is_admin_or_manager());

create policy "All authenticated users can insert activity log" on public.activity_log
  for insert with check (auth.uid() is not null);

-- ---- REVIEWS RLS ----
create policy "Admins and managers can view reviews" on public.reviews
  for select using (public.is_admin_or_manager());

create policy "Admins and managers can manage reviews" on public.reviews
  for all using (public.is_admin_or_manager());

-- ---- COMPANY SETTINGS RLS ----
create policy "All authenticated users can view company settings" on public.company_settings
  for select using (auth.uid() is not null);

create policy "Only admins can update company settings" on public.company_settings
  for update using (public.is_admin());

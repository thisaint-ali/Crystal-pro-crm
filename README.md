# Crystal Pro Powerwashing CRM

Production-ready CRM for Crystal Pro Powerwashing — Northern Virginia exterior cleaning.

## Stack

- **Next.js 15** (App Router, React 19, TypeScript)
- **Supabase** (PostgreSQL, Auth, Storage, RLS)
- **Tailwind CSS 3.4** + shadcn/ui
- **Vercel** (hosting)

## Features

- Role-based access: Admin / Manager / Worker
- Leads → Quotes → Jobs → Payments pipeline
- Photo upload (before/after/damage) via Supabase Storage
- Tasks with auto-creation on quote sent / job completed
- Google review request workflow
- Weekly calendar view
- Mobile-first responsive design

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL Editor
3. Run `supabase/migrations/002_storage.sql`
4. Optionally run `supabase/seed.sql` for demo data

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## First Admin Setup

After creating your Supabase project and running migrations:

1. Go to `/login` and sign up with your email
2. In Supabase Dashboard → Table Editor → `profiles`
3. Find your row and set `role = 'admin'` and `active = true`
4. Refresh the app — you now have full access

## Project Structure

```
app/
  (dashboard)/       # All authenticated routes
    dashboard/       # Stats overview
    leads/           # Lead management
    customers/       # Customer records
    quotes/          # Quote builder with line items
    jobs/            # Job scheduling and tracking
    calendar/        # Weekly calendar view
    tasks/           # Open/completed task list
    payments/        # Payment collection
    reviews/         # Google review workflow
    team/            # User management (admin)
    settings/        # Company settings (admin)
  login/             # Auth page
components/
  ui/                # shadcn/ui primitives
  shared/            # Reused components (StatusBadge, EmptyState, etc.)
  layout/            # Sidebar, MobileNav
  leads/ customers/ quotes/ jobs/ tasks/ payments/ reviews/ settings/ team/
lib/
  actions/           # Server actions (mutations)
  validations/       # Zod schemas
  auth/              # Permission helpers
  constants/         # App-wide constants
  supabase/          # Client/server Supabase helpers
  utils/             # Formatting utilities
supabase/
  migrations/        # SQL schema + storage setup
  seed.sql           # Demo data
types/               # TypeScript database + domain types
```

## Roles

| Role    | Access |
|---------|--------|
| Admin   | Full access + team management + settings |
| Manager | Leads, customers, quotes, jobs, payments, reviews, calendar |
| Worker  | Own assigned jobs and tasks only |

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full Vercel deployment instructions.

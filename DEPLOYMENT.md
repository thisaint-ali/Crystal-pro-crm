# Deployment Guide

## Prerequisites

- Supabase project (free tier works)
- Vercel account (free tier works)
- GitHub repository

## Step 1: Supabase Setup

1. Create project at [supabase.com](https://supabase.com)
2. In the SQL Editor, run in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_storage.sql`
3. In Authentication → Settings:
   - Set Site URL to your Vercel URL (e.g., `https://crystal-pro-crm.vercel.app`)
   - Add the same URL to Redirect URLs
4. Copy your project URL and anon key from Project Settings → API

## Step 2: Vercel Deployment

1. Push code to GitHub
2. Import repo in [vercel.com/new](https://vercel.com/new)
3. Framework: **Next.js** (auto-detected)
4. Add environment variables:

```
NEXT_PUBLIC_SUPABASE_URL    = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY   = eyJ...   (mark as sensitive)
```

5. Deploy

## Step 3: First Admin Account

1. Go to your deployed URL → `/login`
2. Sign up with your admin email
3. In Supabase → Table Editor → `profiles`
4. Find your row, set `role = 'admin'` and `active = true`
5. Log back in — you now have full admin access

## Step 4: Initial Settings

1. Go to Settings page
2. Update company phone, email, address
3. Add your Google Review link (from Google Business Profile → Get more reviews → Share review form)

## Step 5: Add Team Members

1. Each team member signs up at `/login`
2. Go to Team page → activate their account and assign role

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key (safe for client) |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Service role key (server only, not currently used) |

## Supabase Storage

The `job-photos` bucket is created by `002_storage.sql`. It's set to **public** so photo URLs work without auth tokens. If you need private photos, update the bucket policy and generate signed URLs instead.

## Custom Domain

In Vercel → Project → Settings → Domains, add your domain. Then update Supabase Auth redirect URLs to include the custom domain.

## Monitoring

- Check Vercel Function logs for server action errors
- Check Supabase → Logs → API for database query issues
- Enable Supabase → Alerts for connection limit warnings

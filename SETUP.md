# Phase 2 Setup Guide: Supabase Integration

This guide walks you through setting up Supabase for the Kefalonia Trips platform.

## Prerequisites

- A Supabase account (free tier is perfect for MVP)
- Node.js 18+ installed
- The Phase 1 codebase

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose a name: `kefalonia-trips`
4. Set a strong database password (save this!)
5. Choose a region close to Greece (e.g., Frankfurt)
6. Wait 2-3 minutes for provisioning

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Project API keys** → **anon public** (this is safe for client-side)
   - **Project API keys** → **service_role** (keep this secret!)

## Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and fill in your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

## Step 4: Run Database Migrations

### Option A: Using Supabase SQL Editor (Recommended for first time)

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the contents of `supabase/migrations/20250101000000_initial_schema.sql`
4. Paste into the editor and click **Run**
5. Wait for success message
6. Repeat for `supabase/migrations/20250101000001_seed_pois.sql`

### Option B: Using Supabase CLI (Advanced)

If you have the Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Step 5: Verify Database Setup

1. Go to **Table Editor** in Supabase dashboard
2. You should see these tables:
   - `providers`
   - `vehicles`
   - `pois` (with 13 rows seeded)
   - `trips`
   - `trip_pois`
   - `bookings`
   - `availability`
   - `reviews`
   - `notifications`

3. Click on **pois** table - you should see 13 POIs from Kefalonia

## Step 6: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider (enabled by default)
3. Configure email templates:
   - **Invite user**: Custom template for provider invites
   - **Confirm signup**: Email verification
   - **Magic Link**: For passwordless login (optional)

4. Optionally enable social providers:
   - Google OAuth (good for providers who want quick signup)
   - Facebook OAuth

## Step 7: Set Up Row Level Security (RLS)

Good news! RLS policies are already included in the migration.

To verify:
1. Go to **Authentication** → **Policies**
2. Check each table has policies enabled
3. Key policies:
   - POIs and Trips are publicly readable
   - Providers can only manage their own data
   - Anyone can create bookings (customers)
   - Providers can view/update their own bookings

## Step 8: (Optional) Set Up Email Notifications

We'll use Resend for transactional emails.

1. Sign up at [https://resend.com](https://resend.com)
2. Get your API key
3. Add to `.env.local`:
   ```bash
   RESEND_API_KEY=re_your_api_key
   NOTIFICATIONS_FROM_EMAIL=noreply@yourdomain.com
   ```

4. Verify your domain (or use Resend's testing domain for development)

## Step 9: Test the Connection

1. Start your development server:
   ```bash
   npm run dev
   ```

2. The app should now connect to Supabase
3. POIs will be loaded from the database instead of mock data

## Step 10: Create Your First Provider Account

1. Go to Supabase dashboard → **Authentication** → **Users**
2. Click **Add User** (invite via email)
3. Or use the signup flow we'll build in the provider dashboard

## What's Next?

Now that your infrastructure is set up, you can:

1. **Create provider accounts** - Test the provider signup flow
2. **Create trips in the dashboard** - Build and test the trip management UI
3. **Test bookings** - Submit bookings and see them in the database
4. **Set up email notifications** - Get emails when bookings are made

## Troubleshooting

### "Failed to fetch" errors
- Check your `.env.local` file has correct URLs
- Restart your dev server after changing env variables
- Verify CORS settings in Supabase (should allow `localhost:3000`)

### RLS policy errors
- Make sure you're logged in as a user with the right role
- Check the provider record has `user_id` matching your auth user
- Review policies in **Authentication** → **Policies**

### Migration errors
- Run migrations in order (initial schema first, then seed data)
- Check for syntax errors in the SQL
- Look at Supabase logs: **Database** → **Logs**

## Database Schema Overview

```
providers (taxi operators)
  ↓
  ├─ vehicles (their fleet)
  ├─ trips (custom trips they create)
  │   └─ trip_pois (POIs included in each trip)
  ├─ availability (when they're available)
  └─ bookings (customer bookings)
      └─ reviews (customer feedback)

pois (points of interest - beaches, caves, etc.)
  ↑
  └─ used by trips
```

## Security Best Practices

- ✅ **Never commit `.env.local`** (already in .gitignore)
- ✅ **Use service_role key only on server-side** (API routes)
- ✅ **Keep anon key public** (it's safe with RLS enabled)
- ✅ **Enable MFA** for your Supabase dashboard account
- ✅ **Regularly backup your database** (Supabase does daily backups on paid plans)

---

**Need help?** Check the Supabase docs: https://supabase.com/docs or create an issue in the repo.

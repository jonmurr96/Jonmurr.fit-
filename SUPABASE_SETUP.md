# Supabase Setup Guide

This guide will walk you through setting up Supabase for the Jonmurr.fit application.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in your project details:
   - Project name: `jonmurr-fit` (or your preferred name)
   - Database password: (choose a strong password)
   - Region: Choose closest to your users
4. Click "Create new project"
5. Wait for the project to be provisioned (usually 1-2 minutes)

## 2. Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (under "Project API keys")

## 3. Update Environment Variables

Add the following to your `.env.local` file:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
GEMINI_API_KEY=your_existing_gemini_key
```

## 4. Run Database Migrations

You have two options to set up the database schema:

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click "New query"
4. Copy and paste the contents of `supabase/migrations/20250106000000_initial_schema.sql`
5. Click "Run" to execute
6. Repeat for `supabase/migrations/20250106000001_rls_policies.sql`

### Option B: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Link your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## 5. Enable Email Authentication

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Ensure **Email** provider is enabled
3. Configure email templates if desired (optional)

## 6. Configure Realtime (Optional but Recommended)

Realtime is enabled by default, but you can configure it:

1. Go to **Database** → **Replication**
2. Make sure the following tables are enabled for replication:
   - `meals`
   - `food_items`
   - `weight_logs`
   - `water_logs`
   - `workout_history`
   - `streaks`
   - `milestones`

## 7. Test Your Setup

Run the app locally:

```bash
npm run dev
```

Try to:
1. Sign up with a new account
2. Check if you can see the user in **Authentication** → **Users**
3. Check if profile and related tables are created in **Database** → **Table Editor**

## Database Schema Overview

The application uses the following main tables:

- **profiles**: User profile information
- **macro_targets**: Daily macro nutrition targets (rest/training days)
- **weight_logs**: Weight tracking over time
- **water_logs**: Daily water intake tracking
- **meals & food_items**: Food logging
- **training_programs**: Active workout programs
- **saved_workouts**: Workout library
- **workout_history**: Completed workout records
- **favorite_exercises**: User's favorite exercises
- **workout_drafts**: Saved workout drafts
- **photo_bundles**: Progress photos
- **milestones**: Achievement tracking
- **streaks**: Workout, nutrition, and water streaks
- **meal_plans**: Generated meal plans
- **user_settings**: User preferences

## Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only access their own data
- Automatic user_id filtering on all queries
- Secure insert/update/delete operations

### Automatic Triggers

- **New user registration**: Automatically creates profile, default macro targets, settings, and streaks
- **Streak tracking**: Automatically updates streaks when workouts are completed, meals are logged, or water goals are met
- **Updated timestamps**: Automatically updates `updated_at` fields

## Troubleshooting

### "Missing Supabase environment variables" Error
- Make sure `.env.local` exists and has the correct variables
- Restart your dev server after adding environment variables

### RLS Policies Not Working
- Ensure you're authenticated (check `supabase.auth.getUser()`)
- Verify RLS is enabled on all tables
- Check policy definitions in the SQL migrations

### Realtime Not Working
- Ensure realtime is enabled for the specific tables
- Check that your subscription channel names match table names
- Verify you're authenticated before subscribing

## Next Steps

- Customize email templates in **Authentication** → **Email Templates**
- Set up storage buckets for progress photos (optional)
- Configure custom domains (production)
- Set up database backups (recommended for production)

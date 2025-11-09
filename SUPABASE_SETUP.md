# Supabase Backend Setup Guide

Your fitness app is now configured to use Supabase as the backend database! Follow these steps to complete the setup.

## ✅ Already Done

1. ✓ Supabase client library installed
2. ✓ Environment variables configured (SUPABASE_URL, SUPABASE_ANON_KEY)
3. ✓ Database service layers created
4. ✓ Vite configuration updated

## 🚀 What You Need to Do

### Step 1: Create the Database Tables

**You must run the SQL schema in your Supabase project before the app will work.**

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file `supabase/schema.sql` in this project
6. Copy the entire contents
7. Paste it into the Supabase SQL editor
8. Click **Run** (or press Ctrl/Cmd + Enter)

This will create all 23 tables needed for the app to function.

### Step 2: Verify the Setup

1. In Supabase, go to **Table Editor** in the left sidebar
2. You should see all these tables:
   - user_profile
   - macro_targets
   - daily_logs
   - meals & food_items
   - training_programs, workouts, exercises, workout_sets
   - weight_logs, water_logs
   - progress_photos
   - gamification_state, streaks, earned_badges, challenges
   - generated_meal_plans
   - And more...

### Step 3: Test the App

Once the schema is created:
1. Refresh your app
2. The app should now save all data to Supabase
3. Data will persist across sessions and page refreshes
4. Try logging a meal or starting a workout

## 📊 What Changed

### Before (Local Storage)
- Data stored in browser memory
- Lost on page refresh
- Mock/fake historical data
- No cross-device sync

### After (Supabase Backend)
- Data stored in cloud database
- Persists forever
- Real data tracking
- Access from any device (same Supabase project)

## 🔧 How It Works

The app now uses these database services:

- **userService**: Profile and macro targets
- **mealService**: Meals, food items, daily logs
- **workoutService**: Training programs and workout history
- **progressService**: Weight, water, photos, milestones
- **gamificationService**: XP, streaks, badges, challenges
- **mealPlanService**: AI-generated meal plans

All services automatically sync with Supabase whenever you:
- Log a meal
- Complete a workout
- Track your weight
- Update your profile
- Earn achievements

## 🎯 Single-User Design

This app is currently designed for **single-user** operation:
- No login/signup required
- All data belongs to one user (you!)
- Perfect for personal fitness tracking

If you want multi-user support in the future, see `supabase/README.md` for migration instructions.

## ⚠️ Important Notes

1. **Run the schema first**: The app won't work until you create the database tables
2. **One-time setup**: You only need to run the schema once per Supabase project
3. **Data persistence**: Once set up, all your fitness data will be saved permanently
4. **Backup**: Your data is automatically backed up by Supabase

## 🆘 Troubleshooting

**App shows errors after setup:**
- Check the browser console for errors
- Verify all tables were created in Supabase
- Confirm your SUPABASE_URL and SUPABASE_ANON_KEY are correct

**Data not saving:**
- Check Table Editor in Supabase to see if records appear
- Look for error messages in the browser console
- Verify the SQL schema ran without errors

**Need to start fresh:**
- In Supabase SQL Editor, you can drop all tables with:
  ```sql
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  ```
- Then run the schema.sql again

## 📚 Next Steps

After setup is complete:
1. Start logging meals and workouts
2. Watch your data persist in Supabase
3. Check the Table Editor to see your data in real-time
4. Enjoy your fully functional fitness tracking app!

# Supabase Database Setup

This directory contains the database schema and setup instructions for the Jonmurr.fit app.

## Quick Setup

### Step 1: Run the Schema
1. Go to your Supabase project dashboard
2. Click on the **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `schema.sql` into the query editor
5. Click **Run** to execute the SQL

This will create all the necessary tables, indexes, and constraints for your fitness app.

### Step 2: Verify Setup
After running the schema, you should see the following tables in your database:
- `user_profile`
- `macro_targets`
- `daily_logs`
- `meals`
- `food_items`
- `quick_add_meals`
- `quick_add_meal_items`
- `training_programs`
- `workouts`
- `exercises`
- `workout_sets`
- `saved_workouts`
- `workout_history`
- `weight_logs`
- `water_logs`
- `progress_photos`
- `milestones`
- `gamification_state`
- `streaks`
- `earned_badges`
- `challenges`
- `generated_meal_plans`

## Database Schema Overview

### User & Settings
- **user_profile**: Stores user name, avatar, and height
- **macro_targets**: Daily macro targets for rest and training days

### Nutrition Tracking
- **daily_logs**: Aggregated daily macro totals
- **meals**: Individual meals with timestamps
- **food_items**: Food items within each meal
- **quick_add_meals**: Template meals for quick logging
- **generated_meal_plans**: AI-generated meal plans

### Workout Tracking
- **training_programs**: Complete workout programs
- **workouts**: Individual workouts within a program
- **exercises**: Exercises within workouts
- **workout_sets**: Sets within exercises
- **saved_workouts**: Library of saved workout programs
- **workout_history**: Log of completed workouts

### Progress Tracking
- **weight_logs**: Weight measurements over time
- **water_logs**: Daily water intake
- **progress_photos**: Progress photos (front, side, back)
- **milestones**: Achievement milestones

### Gamification
- **gamification_state**: User XP and level
- **streaks**: Workout, meal, and water streaks
- **earned_badges**: Unlocked badges
- **challenges**: Active and completed challenges

## Data Model

### Single-User Design (MVP)
This app is currently designed as a **single-user application**. All tables use a `user_id` field hardcoded to `'default_user'`. This is intentional for the MVP release and simplifies the architecture.

**Important**: This means:
- No user authentication is required
- All data belongs to one user
- Anyone with access to the app can see all data
- Perfect for personal use or demos

### Future Multi-User Support
To convert to multi-user in the future:
1. Implement Supabase Auth (sign up/login)
2. Replace hardcoded `'default_user'` with `supabase.auth.getUser().id`
3. Enable Row Level Security (RLS) on all tables
4. Add RLS policies to restrict data access by authenticated user
5. Update the services to use the authenticated user's ID

## Row Level Security (RLS)

RLS is not currently enabled, as this is designed for single-user operation. If you plan to expand to multi-user, you'll need to:
1. Enable RLS on all tables
2. Add policies for authenticated users
3. Update the `user_id` to use actual user authentication

## Indexes

The schema includes indexes on frequently queried fields:
- Date-based queries (daily_logs, meals, weight_logs, water_logs)
- User-based queries (training_programs, saved_workouts)

These indexes ensure fast query performance as your data grows.

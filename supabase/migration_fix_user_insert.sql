-- Fix: Add INSERT policy for users table
-- The trigger function needs permission to create user profiles

-- Add INSERT policy to allow users table inserts
-- This allows the trigger to create profiles for new auth users
CREATE POLICY IF NOT EXISTS "Users can insert own profile"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid()::text = id);

-- Alternative: If the above doesn't work, we can make the trigger bypass RLS
-- by using SECURITY DEFINER SET search_path properly, but the policy approach is cleaner

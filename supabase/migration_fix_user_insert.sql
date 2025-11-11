-- Fix: Add INSERT policy for users table
-- The trigger function needs permission to create user profiles

-- Drop policy if it exists, then create it
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Add INSERT policy to allow users table inserts
-- This allows the trigger to create profiles for new auth users
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid()::text = id);

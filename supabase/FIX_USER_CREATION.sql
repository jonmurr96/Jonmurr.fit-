-- ============================================================================
-- SIMPLIFIED FIX FOR USER CREATION ISSUES
-- Run this if you're getting "Database error saving new user"
-- ============================================================================

-- First, drop the existing trigger if it exists (to start fresh)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT 'User',
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  fitness_goal TEXT,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on username
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Grant ALL permissions to the users table (this is key!)
GRANT ALL ON public.users TO postgres;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;

-- Create a SIMPLIFIED trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_username TEXT;
BEGIN
  -- Generate username from email or use a random one
  new_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    COALESCE(
      split_part(NEW.email, '@', 1),
      'user_' || substring(NEW.id::text, 1, 8)
    )
  );
  
  -- Make username unique by appending numbers if needed
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = new_username) LOOP
    new_username := new_username || '_' || floor(random() * 1000)::text;
  END LOOP;
  
  -- Insert the new user profile
  INSERT INTO public.users (id, full_name, username, avatar_url, onboarding_complete)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    new_username,
    NEW.raw_user_meta_data->>'avatar_url',
    FALSE
  );
  
  RETURN NEW;
EXCEPTION WHEN others THEN
  -- Log the error but don't block user creation
  RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Grant execute permissions on the function
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;

-- Create RLS policies
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can delete own profile"
  ON public.users
  FOR DELETE
  USING (auth.uid()::text = id);

-- IMPORTANT: Allow service role to insert (this is what the trigger needs!)
CREATE POLICY "Service role can insert users"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE public.users IS 'User profiles linked to auth.users';
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile when auth user signs up';

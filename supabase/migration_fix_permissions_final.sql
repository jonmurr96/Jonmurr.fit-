-- COMPREHENSIVE FIX: Grant all necessary permissions for trigger function

-- Step 1: Grant permissions on the users table
GRANT ALL ON public.users TO postgres;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.users TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Step 2: Recreate the trigger function with explicit permissions and error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Insert with explicit error handling
  INSERT INTO public.users (id, full_name, username, avatar_url, onboarding_complete)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'avatar_url',
    FALSE
  );
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error (will appear in Supabase logs)
    RAISE WARNING 'Error creating user profile for %: %', NEW.id, SQLERRM;
    -- Re-raise the error so Supabase knows it failed
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Set the function owner to postgres (superuser)
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Step 4: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- Step 5: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Verify the setup
DO $$
BEGIN
  RAISE NOTICE 'Trigger function permissions updated successfully';
  RAISE NOTICE 'Users table permissions granted';
  RAISE NOTICE 'Trigger recreated on auth.users';
END $$;

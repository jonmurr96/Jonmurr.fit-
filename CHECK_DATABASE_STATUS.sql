-- Check which tables exist in your database
-- Run this in Supabase SQL Editor to see what you have

SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- ============================================================================
-- JONMURR.FIT - COMPLETE DATABASE SETUP (SAFE - HANDLES EXISTING TABLES)
-- Run this entire script in your Supabase SQL Editor to set up the database
-- This version safely handles existing tables and policies
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

BEGIN;

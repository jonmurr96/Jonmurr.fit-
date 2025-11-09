# Jonmurr.fit - AI Fitness Coach

## Overview
This is an AI-powered fitness tracking application built with React, TypeScript, and Vite. It uses Google's Gemini AI for intelligent workout planning and meal suggestions.

**Current State**: Successfully configured for Replit environment and ready to run.

## Recent Changes (Nov 9, 2025)

### Database Setup & Bug Fixes (Latest)
- **🔧 Fixed Meal Logging Bug**: Identified and resolved critical issue where meals weren't saving
  - Root cause: Database tables didn't exist in Supabase (schema not applied)
  - Fixed database upsert conflict: Added `onConflict: 'user_id,date'` to daily_logs upsert
  - Fixed removeFoodItem: Now properly syncs with database and maintains correct meal IDs
- **🚀 Added Database Health Check System**: 
  - Created healthCheck.ts service that detects missing tables on app startup
  - Built SetupModal component with clear 8-step instructions to apply schema
  - Integrated automatic detection: App shows setup modal if database tables are missing
  - User-friendly retry mechanism after schema is applied
- **📝 Important**: Users must apply schema.sql to Supabase before app will function
  - See SetupModal for step-by-step instructions
  - Schema creates all 23 required tables
  - One-time setup process

### Earlier Nov 9 Changes
- **GitHub Import Setup**: Configured the project to run in Replit environment
- **Port Configuration**: Changed dev server from port 3000 to 5000 for Replit webview compatibility
- **Security Update**: Moved WGER_API_KEY from hardcoded value to environment variable
- **Proxy Configuration**: Added `allowedHosts: true` to Vite config for Replit's iframe proxy
- **Deployment**: Configured autoscale deployment with Vite preview server
- **Dependencies**: All npm packages installed successfully
- **Supabase Backend**: Added complete database backend with 23 tables
  - Installed @supabase/supabase-js client library
  - Created comprehensive database schema (supabase/schema.sql)
  - Built 6 database service layers for all app features
  - Configured environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)
  - Added detailed setup documentation (SUPABASE_SETUP.md)
- **Supabase Integration in App.tsx**: Fully integrated database with React app
  - Added initialization function that loads all user data from Supabase on app mount
  - Replaced localStorage persistence with Supabase database calls
  - Updated mutation functions (meals, gamification, water tracking) to save to Supabase
  - Added loading screen during data initialization
  - Implemented proper error handling for all database operations
  - Data now persists across sessions and devices
- **Comprehensive Gamification System v2 (✅ FULLY INTEGRATED)**:
  - **100-Level System**: Exponential XP curve targeting ~50k total XP at level 100
    - 6 rank titles: Newbie (1-10), Rookie (11-25), Unit (26-40), Gym Rat (41-60), Gym Addict (61-80), Bodybuilder (81-100)
    - Mathematically verified progression: Level 2=9 XP, Level 50=472 XP, Level 100=1,093 XP per level
    - Perk system with 20+ level-based unlocks (themes, features, bonuses)
  - **Expanded Badge System**: 45+ badges across 8 categories
    - Workout (8), Nutrition (8), Hydration (3), Streaks (7), Progress (4), AI Usage (4), Challenges (4), Milestones (7)
    - Event-driven badge evaluation with automatic checking on XP triggers
  - **Loot/Rewards System**: Mystery chests with weighted random rewards
    - 13 loot items across 4 rarity tiers (common 50%, rare 30%, epic 15%, legendary 5%)
    - Unlocked at milestone levels (5, 10, 15, 20, 25, etc.)
    - Types: exclusive tips, exercises, UI themes, XP boosts
  - **Enhanced Challenge System**: Weekly, monthly, and recovery challenges
    - Weekly: 6 types (rotate 3 per week)
    - Monthly: 3 types for long-term goals
    - Recovery challenges when streaks break
  - **Database Schema v2**: Created migration_gamification_v2.sql
    - user_gamification_profile table (numeric_level, rank_title, total_xp, perks_unlocked, xp_multiplier)
    - loot_inventory table (tracks unlocked items)
    - challenge_progress table (historical analytics)
    - ai_usage_log table (tracks AI feature usage)
    - xp_transactions table (audit log for debugging)
  - **Full Integration Complete**:
    - ✅ useGamification hook: Centralized state management with XP triggers
    - ✅ Visual feedback: Level-up modal, XP toast, badge unlock modal, mystery chest modal
    - ✅ XP triggers integrated: 200 XP (workouts), 30 XP (meals), 10 XP (water), 75 XP (AI usage)
    - ✅ Gamification Dashboard: 4-tab interface (Overview, Badges, Challenges, Loot)
    - ✅ Navigation: Clickable XP bar on HomeScreen with full accessibility
    - ✅ Badge automation: Event-driven evaluation with context tracking
    - ✅ Feedback queue: Sequential display (level-up → badges → toasts)
  - **📋 MIGRATION REQUIRED**: Database migration pending (see MIGRATION_GUIDE.md)
    - Migration file: `supabase/migration_gamification_v2.sql`
    - Instructions: Step-by-step guide in `MIGRATION_GUIDE.md`
    - Test plan: Comprehensive testing checklist included

## Project Architecture

### Tech Stack
- **Frontend Framework**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 6.2.0
- **AI Service**: Google Gemini API (@google/genai)
- **Charts**: Recharts for progress visualization
- **Styling**: Tailwind CSS (CDN version)
- **Exercise Database**: WGER API integration

### Key Files
- `App.tsx` - Main application component with state management
- `vite.config.ts` - Vite configuration (port 5000, host 0.0.0.0)
- `services/geminiService.ts` - Gemini AI integration for workouts and meals
- `services/supabaseClient.ts` - Supabase client configuration
- `services/database/` - Database service layers (user, meal, workout, progress, gamification, mealPlan)
- `supabase/schema.sql` - Complete database schema (23 tables)
- `components/` - Reusable UI components
- `screens/` - Main application screens (Home, Train, Log, Progress, Coach)

### Environment Variables
- `GEMINI_API_KEY` - Required for AI features (get from https://aistudio.google.com/app/apikey)
- `WGER_API_KEY` - Required for exercise database (get from https://wger.de/en/software/api)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous/public API key

## Architecture Notes

### Client-Side Design
This app is architected as a client-side application that makes direct API calls to Google's Gemini service from the browser. This is intentional and matches the original Google AI Studio export design.

**Important**: API keys are bundled into the client-side code via Vite's `define` option. This is typical for client-side AI applications but means:
- API keys are visible in the browser bundle
- Rate limiting and security are managed by Google's API quotas
- Users should use their own API keys for production deployments

### Replit-Specific Configuration
- **Dev Server**: Configured for port 5000 with host 0.0.0.0
- **Proxy Support**: `allowedHosts: true` allows Replit's iframe proxy to work correctly
- **Deployment**: Uses Vite preview server for production builds

## How to Run

### Development
The app is already configured to run automatically. The workflow runs:
```bash
npm run dev
```

This starts the Vite dev server on port 5000.

### Production Deployment
When you publish this app, it will:
1. Build the production bundle: `npm run build`
2. Serve it using: `npx vite preview --host 0.0.0.0 --port 5000`

## Features
- **Daily Macro Tracking**: Track calories, protein, carbs, and fat
- **AI Workout Generation**: Get personalized workout plans from Gemini AI
- **AI Meal Planning**: Generate meal plans based on your macro targets
- **Progress Tracking**: Visualize your fitness journey with charts
- **Gamification**: Earn XP, level up, and complete challenges
- **Exercise Database**: Access to WGER's comprehensive exercise library

## User Preferences
None documented yet - this is a fresh import.

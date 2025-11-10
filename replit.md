# Jonmurr.fit - AI Fitness Coach

## Overview
Jonmurr.fit is an AI-powered fitness tracking application built with React, TypeScript, and Vite. Its core purpose is to provide personalized workout planning and meal suggestions using Google's Gemini AI. The project aims to gamify the fitness journey through XP, leveling, and challenges, offering a comprehensive solution for users to track progress and achieve their health goals.

## User Preferences
None documented yet - this is a fresh import.

## Recent Changes (Nov 9, 2025)

### XP Toast Bug Fix (Latest - Nov 9, 2025 @ 8:57 PM)
- **🐛 Fixed Stuck XP Toast**: Resolved issue where XP toasts wouldn't dismiss and blocked screen
  - **Root Cause**: Water logging awarded 10 XP on EVERY slider adjustment, creating endless toast queue
  - **The Fix**: Added daily guard for water XP (only awards once per day on first log)
  - **How It Works**: Uses `jonmurrfit-lastWaterXpAward` localStorage check (same pattern as protein/macro goals)
  - **Result**: Toasts now properly auto-dismiss after 3 seconds, no more blocking screen
- **🎯 Additional XP Fixes**:
  - Changed protein goal from 0 XP to 25 XP for meaningful rewards
  - All daily XP awards now have proper guards: water (10 XP), protein goal (25 XP), macro goals (50 XP)
  - Toast queue system confirmed working - each toast dismisses after timeout, queue advances properly

### Workout Status System Implementation (Nov 9, 2025 @ 6:05 PM)
- **🏷️ Status Tagging System**: Implemented Active/Inactive/Draft workflow status system
  - Added `status: 'active' | 'inactive' | 'draft'` field to SavedWorkout type
  - Created `StatusBadge` component with color-coded tags (Active=green, Inactive=gray, Draft=yellow)
  - **Single Active Plan Rule**: Only ONE workout can be active at a time (enforced by setActiveWorkout)
  - Users can save unlimited workouts but must designate one as their active plan
- **🎯 Smart UI Organization**: TrainScreen now organizes workouts by status
  - **Active Plan** section (if exists) → Shows current active workout at top
  - **Drafts** section (if exist) → Shows incomplete/experimental workouts
  - **My Library** section → Shows all inactive saved workouts
  - Each workout card displays StatusBadge next to title
  - "Set as Active" button on inactive workouts
- **⚡ HomeScreen QuickStart Update**: Now shows ONLY the active plan
  - QuickStart card displays the single active workout (if one exists)
  - Added "Active Plan" label for clarity
  - Card hidden entirely if no active plan is set
  - Removed old pinned/recent logic in favor of explicit active status
- **🔄 Backward Compatibility**: Normalization useEffect backfills existing workouts
  - All saved workouts without status automatically set to 'inactive'
  - Runs once on app mount, guards against re-renders
  - Ensures smooth transition for users with existing workout libraries
- **💾 Database Migration Pending**: Supabase migration needed for persistence
  - Status field currently client-side only (localStorage)
  - Future migration: Add status column to saved_workouts table with default 'inactive'
  - Will enable cross-device status synchronization
- **✅ Architect Approved**: Full implementation reviewed and passed

## System Architecture

### UI/UX Decisions
The application features a modern, engaging design with a focus on gamification. Key UI/UX elements include:
- Glassmorphism action cards with backdrop blur and gradient overlays.
- Primary AI card highlighted with green gradient and shimmer effect.
- Microinteractions such as hover scale, focus rings, and transform animations.
- Mobile-first responsive design, adapting layouts for different screen sizes.
- Color-coded badges for workout statuses (Active, Inactive, Draft) and tiered progression (Bronze, Silver, Gold, Diamond).
- UI elements for gamification like level-up modals, XP toasts, badge unlock modals, and mystery chest modals.

### Technical Implementations
- **Frontend**: React 19.2.0 with TypeScript, built using Vite 6.2.0.
- **AI Integration**: Google Gemini API for workout and meal plan generation, utilizing a single API call for parsing and review to optimize speed.
- **Styling**: Tailwind CSS is used for rapid and consistent styling.
- **Charts**: Recharts library for data visualization and progress tracking.
- **Database**: Supabase serves as the backend, managing user data, workout logs, meal entries, and gamification state across 23 tables.
- **Exercise Database**: Integration with the WGER API for a comprehensive exercise library.
- **Workout Status System**: Implements an 'active', 'inactive', 'draft' status for workouts, enforcing a single active plan rule.
- **Gamification System**: A comprehensive system featuring:
    - **Tiered Badge Progression**: Badges across 8 categories with Bronze, Silver, Gold, Diamond tiers and associated XP rewards.
    - **100-Level System**: Exponential XP curve with rank titles and level-based perks.
    - **Loot/Rewards System**: Mystery chests with weighted random rewards unlocked at milestone levels.
    - **Challenge System**: Weekly, monthly, and recovery challenges.
    - **XP Triggers**: Integrated XP rewards for workouts, meals, water tracking, and AI usage, including specific rewards for hitting macro goals.

### Feature Specifications
- **Daily Macro Tracking**: Users can log and track calories, protein, carbohydrates, and fats.
- **AI-Powered Planning**: Generation of personalized workout routines and meal plans based on user input and targets.
- **Progress Visualization**: Charts and graphs to track fitness journey and achievements.
- **Workout Management**: Users can save, organize by status (Active, Draft, Library), and set active workout plans.
- **Health Checks**: An integrated health check system detects missing Supabase tables and guides users through schema application.

### System Design Choices
- **Client-Side AI Calls**: Direct API calls to Google's Gemini service are made from the browser, with API keys bundled client-side.
- **Replit Compatibility**: Configured for Replit with dev server on port 5000, host 0.0.0.0, and `allowedHosts: true` for proxy support.
- **Data Persistence**: Replaced local storage with Supabase for persistent data storage across sessions and devices.
- **Modular Component Architecture**: UI is built with reusable components for maintainability.

## External Dependencies
- **Google Gemini API**: Used for AI-driven workout and meal plan generation.
- **Supabase**: Backend-as-a-service for database management and authentication.
- **WGER API**: Provides access to a comprehensive exercise database.
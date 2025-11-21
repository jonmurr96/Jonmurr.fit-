# Jonmurr.fit - AI Fitness Coach

## Overview
Jonmurr.fit is an AI-powered fitness tracking application that provides personalized workout planning and meal suggestions using Google's Gemini AI. Built with React, TypeScript, and Vite, the project aims to gamify the fitness journey through XP, leveling, and challenges, offering a comprehensive solution for users to track progress and achieve health goals. The business vision is to provide an engaging, personalized fitness solution that leverages AI for tailored guidance and gamification for sustained user engagement, standing out in the market.

## User Preferences
- **Meal Plans Favor Training Day Macros**: AI-generated meal plans use training day macro targets (+10% calories, +5% protein, +15% carbs) instead of rest day targets to better support workout performance and recovery.

## System Architecture

### UI/UX Decisions
The application features a modern, engaging design with a focus on gamification, utilizing glassmorphism action cards, microinteractions (hover scale, focus rings, transform animations), and a mobile-first responsive design. The UI incorporates color-coded badges for workout statuses and tiered progression, alongside gamification elements like level-up modals, XP toasts, badge unlock modals, and mystery chest modals. The Progress Hub uses scroll spy navigation with sticky chip navigation.

### Technical Implementations
- **Frontend**: React 19.2.0 with TypeScript, built using Vite 6.2.0.
- **AI Integration**: Google Gemini API (gemini-2.5-pro for workouts, gemini-2.5-flash for meals) for workout and meal plan generation, optimized for single API calls and precise macro targeting.
- **Styling**: Tailwind CSS for rapid and consistent styling.
- **Charts**: Recharts library for data visualization.
- **Database**: Supabase for backend, managing user data, workout logs, meal entries, and gamification state across 23 tables, including daily activity summary for heat map tracking.
- **Authentication**: Supabase Auth for email/password and OAuth (Google/Apple) flows, session management, and protected routes with Row Level Security (RLS).
- **Workout Status System**: Implements 'active', 'inactive', 'draft' statuses for workouts, enforcing a single active plan rule.
- **Gamification System**: Features tiered badge progression across 8 categories, a 100-level system with exponential XP curve, a loot/rewards system with mystery chests, and a challenge system. XP is triggered by workouts, meals, water tracking, and AI usage.
- **Heat Map System**: Daily activity tracking with a 6-tier color-coding system visualized in MiniHeatMap (14-day strip) and FullHeatMap (monthly calendar) components, with a DayDetailModal for detailed daily activity breakdown.
- **Onboarding System**: Comprehensive 5-step personalized onboarding flow with scientific calculations (BMR, TDEE, macros, water intake) and database integration for storing responses.
- **Muscle Tracking System**: Interactive muscle recovery visualization with 13 tracked muscle groups, 4-tier color-coded recovery status (fresh, recovering, trained, stale), auto-detection from workout exercises, and database integration via `workout_muscle_engagement` table.

### Feature Specifications
- **Daily Macro Tracking**: Users can log and track calories, protein, carbohydrates, and fats.
- **AI-Powered Planning**: Generation of personalized workout routines and meal plans during onboarding with parallel AI generation.
- **Manual Meal Plan Builder**: Users can create custom meal plans from scratch using the 60-food catalog, with category browsing, search, real-time macro calculations, and dynamic serving size system supporting multiple units (g, oz, cups, tbsp, tsp, ml) with smart presets and inline editing.
- **Food Swap Catalog System**: Interactive meal plan customization with a curated catalog of 60 foods, real-time food swapping with automatic macro recalculation, category-based filtering, search, and favorites management.
- **Progress Visualization**: Charts, graphs, and heat maps to track fitness journey and achievements.
- **Workout Management**: Users can save, organize by status, and set active workout plans.
- **Health Checks**: An integrated health check system detects missing Supabase tables and guides users through schema application.
- **User Authentication**: Secure sign-up, sign-in, password reset, profile management, and onboarding for fitness goals.
- **Settings/Profile Management**: Full-featured profile and account management including updating user profile, password, and account deletion.
- **Muscle Recovery Heatmap**: Visual recovery tracking for 13 muscle groups with MuscleGroupSelector component showing color-coded recovery status, clickable muscle details, and support for both recovery viewing and target muscle selection modes.

### System Design Choices
- **Client-Side AI Calls**: Direct API calls to Google's Gemini service from the browser.
- **Replit Compatibility**: Configured for Replit with dev server on port 5000, host 0.0.0.0, and `allowedHosts: true`.
- **Data Persistence**: Supabase for persistent data storage across sessions and devices.
- **Modular Component Architecture**: UI is built with reusable components for maintainability.
- **Auth Service Layer**: Dedicated service for all authentication and user profile operations.
- **AuthContext Provider**: Manages session, token refresh, and profile loading.
- **Database Service Architecture**: All 8 database services use a factory pattern (`createXService(userId)`) with closure-based functions for multi-user support and Row Level Security (RLS) enforcement.
- **Food Catalog System**: Implements a curated food database (`food_catalog` table) with 60 foods, including nutritional data and tags. User preferences (`user_food_preferences` table) track favorites, blacklisted items, and swap history for personalized recommendations.
- **Dynamic Serving Size System**: Comprehensive unit conversion system with ServingSizeSelector component supporting weight (g, oz) and volume (cups, tbsp, tsp, ml) units. Features density-based conversions (liquids default to volume, solids to weight), smart preset buttons (25g, 50g, 100g, 200g, 1/4 cup, 1/2 cup, 1 cup), and real-time macro recalculation. Users can adjust serving sizes both during initial food selection (FoodCard) and after adding to plan (PlanPreview inline editor).
- **Muscle Recovery Tracking Service**: Database service layer (`muscleTrackingService.ts`) with factory pattern for muscle engagement tracking, automatic muscle detection from exercises using exercise-to-muscle mapping, recovery status queries, and muscle history analytics. Includes 58 SVG muscle anatomy assets (front/back views) organized in `public/assets/anatomy/`.

## External Dependencies
- **Google Gemini API**: Used for AI-driven workout and meal plan generation.
- **Supabase**: Backend-as-as-service for database management, authentication, and real-time features.
- **WGER API**: Provides access to a comprehensive exercise database.
- **USDA FoodData Central API**: Free nutrition database with 1000+ foods for meal planning and food swapping.
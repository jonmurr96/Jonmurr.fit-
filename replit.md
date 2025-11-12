# Jonmurr.fit - AI Fitness Coach

## Overview
Jonmurr.fit is an AI-powered fitness tracking application that provides personalized workout planning and meal suggestions using Google's Gemini AI. Built with React, TypeScript, and Vite, the project aims to gamify the fitness journey through XP, leveling, and challenges, offering a comprehensive solution for users to track progress and achieve health goals. The business vision is to provide an engaging, personalized fitness solution that leverages AI for tailored guidance and gamification for sustained user engagement, standing out in the market.

## User Preferences
None documented yet - this is a fresh import.

## System Architecture

### UI/UX Decisions
The application features a modern, engaging design with a focus on gamification, utilizing glassmorphism action cards with backdrop blur and gradient overlays. Key elements include a primary AI card highlighted with a green gradient and shimmer effect, microinteractions (hover scale, focus rings, transform animations), and a mobile-first responsive design. The UI incorporates color-coded badges for workout statuses (Active, Inactive, Draft) and tiered progression (Bronze, Silver, Gold, Diamond), alongside gamification elements like level-up modals, XP toasts, badge unlock modals, and mystery chest modals. The Progress Hub uses scroll spy navigation with sticky chip navigation.

### Technical Implementations
- **Frontend**: React 19.2.0 with TypeScript, built using Vite 6.2.0.
- **AI Integration**: Google Gemini API for workout and meal plan generation, optimized for single API calls.
- **Styling**: Tailwind CSS for rapid and consistent styling.
- **Charts**: Recharts library for data visualization.
- **Database**: Supabase for backend, managing user data, workout logs, meal entries, and gamification state across 23 tables, including a `daily_activity_summary` table for heat map tracking.
- **Authentication**: Supabase Auth for email/password and OAuth (Google/Apple) flows, session management, and protected routes, with a `users` table for user profiles and Row Level Security (RLS) policies. OAuth users get automatic profile creation with unique username generation and collision retry logic.
- **Workout Status System**: Implements 'active', 'inactive', 'draft' statuses for workouts, enforcing a single active plan rule, and smart UI organization.
- **Gamification System**: Features tiered badge progression across 8 categories (Bronze, Silver, Gold, Diamond tiers) with XP rewards, a 100-level system with exponential XP curve, a loot/rewards system with mystery chests, and a challenge system (weekly, monthly, recovery). XP is triggered by workouts, meals, water tracking, and AI usage.
- **Heat Map System**: Daily activity tracking with a 6-tier color-coding system (Gray, Red, Orange, Green, Diamond, Blue) visualized in MiniHeatMap (14-day strip) and FullHeatMap (monthly calendar) components, with a DayDetailModal for comprehensive daily activity breakdown.
- **Onboarding System**: Comprehensive 5-step personalized onboarding flow (PersonalInfo, FitnessGoals, BodyType, WorkoutPreferences, DietLifestyle, Smart Summary) with scientific calculations (BMR, TDEE, macros, water intake) and database integration for storing responses.

### Feature Specifications
- **Daily Macro Tracking**: Users can log and track calories, protein, carbohydrates, and fats.
- **AI-Powered Planning**: Generation of personalized workout routines and meal plans during onboarding with parallel AI generation using `Promise.allSettled`.
- **Progress Visualization**: Charts, graphs, and heat maps to track fitness journey and achievements.
- **Workout Management**: Users can save, organize by status (Active, Draft, Library), and set active workout plans.
- **Health Checks**: An integrated health check system detects missing Supabase tables and guides users through schema application.
- **User Authentication**: Secure sign-up, sign-in, password reset, profile management, and onboarding for fitness goals.
- **Settings/Profile Management**: Full-featured profile and account management including updating user profile, password, and account deletion.

### System Design Choices
- **Client-Side AI Calls**: Direct API calls to Google's Gemini service from the browser, with API keys bundled client-side.
- **Replit Compatibility**: Configured for Replit with dev server on port 5000, host 0.0.0.0, and `allowedHosts: true`.
- **Data Persistence**: Supabase for persistent data storage across sessions and devices.
- **Modular Component Architecture**: UI is built with reusable components for maintainability.
- **Auth Service Layer**: Dedicated service for all authentication and user profile operations with error typing.
- **AuthContext Provider**: Manages session, token refresh, and profile loading.
- **Database Service Architecture**: All 7 database services use a factory pattern (`createXService(userId)`) with closure-based functions for multi-user support and Row Level Security (RLS) enforcement. All services are refactored to eliminate `this` bindings, capturing `userId` from the factory scope. A `useUserServices` hook provides authenticated, user-scoped database service instances.

## External Dependencies
- **Google Gemini API**: Used for AI-driven workout and meal plan generation.
- **Supabase**: Backend-as-a-service for database management, authentication, and real-time features.
- **WGER API**: Provides access to a comprehensive exercise database.
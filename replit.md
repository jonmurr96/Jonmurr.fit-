# Jonmurr.fit - AI Fitness Coach

## Overview
Jonmurr.fit is an AI-powered fitness tracking application built with React, TypeScript, and Vite. Its core purpose is to provide personalized workout planning and meal suggestions using Google's Gemini AI. The project aims to gamify the fitness journey through XP, leveling, and challenges, offering a comprehensive solution for users to track progress and achieve their health goals. The business vision is to provide a comprehensive, engaging, and personalized fitness solution that stands out in the market by leveraging AI for tailored guidance and gamification for sustained user engagement.

## User Preferences
None documented yet - this is a fresh import.

## System Architecture

### UI/UX Decisions
The application features a modern, engaging design with a focus on gamification, utilizing glassmorphism action cards with backdrop blur and gradient overlays. Key elements include a primary AI card highlighted with a green gradient and shimmer effect, microinteractions (hover scale, focus rings, transform animations), and a mobile-first responsive design. The UI incorporates color-coded badges for workout statuses (Active, Inactive, Draft) and tiered progression (Bronze, Silver, Gold, Diamond), alongside gamification elements like level-up modals, XP toasts, badge unlock modals, and mystery chest modals. The Progress Hub uses scroll spy navigation with sticky chip navigation to improve user experience.

### Technical Implementations
- **Frontend**: React 19.2.0 with TypeScript, built using Vite 6.2.0.
- **AI Integration**: Google Gemini API for workout and meal plan generation, optimized for single API calls.
- **Styling**: Tailwind CSS for rapid and consistent styling.
- **Charts**: Recharts library for data visualization.
- **Database**: Supabase for backend, managing user data, workout logs, meal entries, and gamification state across 23 tables, including a `daily_activity_summary` table for heat map tracking.
- **Exercise Database**: WGER API integration for a comprehensive exercise library.
- **Authentication**: Supabase Auth for email/password flows, session management, and protected routes, with a `users` table for user profiles and RLS policies.
- **Workout Status System**: Implements 'active', 'inactive', 'draft' statuses for workouts, enforcing a single active plan rule, and smart UI organization.
- **Gamification System**:
    - **Tiered Badge Progression**: Badges across 8 categories (Bronze, Silver, Gold, Diamond tiers) with XP rewards, including new badges for heat map achievements (Green Week, Perfect Day Pro, Activity Master).
    - **100-Level System**: Exponential XP curve with rank titles and level-based perks.
    - **Loot/Rewards System**: Mystery chests with weighted random rewards at milestone levels.
    - **Challenge System**: Weekly, monthly, and recovery challenges.
    - **XP Triggers**: Integrated XP for workouts, meals, water tracking, and AI usage, with guards to prevent exploit, and specific rewards for hitting macro goals.
- **Heat Map System**: Daily activity tracking with a 6-tier color-coding system (Gray, Red, Orange, Green, Diamond, Blue) visualized in MiniHeatMap (14-day strip) and FullHeatMap (monthly calendar) components, with a DayDetailModal for comprehensive daily activity breakdown.

### Feature Specifications
- **Daily Macro Tracking**: Users can log and track calories, protein, carbohydrates, and fats.
- **AI-Powered Planning**: Generation of personalized workout routines and meal plans.
- **Progress Visualization**: Charts, graphs, and heat maps to track fitness journey and achievements.
- **Workout Management**: Users can save, organize by status (Active, Draft, Library), and set active workout plans.
- **Health Checks**: An integrated health check system detects missing Supabase tables and guides users through schema application.
- **User Authentication**: Secure sign-up, sign-in, password reset, profile management, and onboarding for fitness goals.
- **Settings/Profile Management**: Full-featured profile and account management including updating user profile, password, and account deletion with validation and secure procedures.

### System Design Choices
- **Client-Side AI Calls**: Direct API calls to Google's Gemini service from the browser, with API keys bundled client-side.
- **Replit Compatibility**: Configured for Replit with dev server on port 5000, host 0.0.0.0, and `allowedHosts: true`.
- **Data Persistence**: Supabase for persistent data storage across sessions and devices.
- **Modular Component Architecture**: UI is built with reusable components for maintainability.
- **Auth Service Layer**: Dedicated service for all authentication and user profile operations with error typing.
- **AuthContext Provider**: Manages session, token refresh, and profile loading.

## External Dependencies
- **Google Gemini API**: Used for AI-driven workout and meal plan generation.
- **Supabase**: Backend-as-a-service for database management, authentication, and real-time features.
- **WGER API**: Provides access to a comprehensive exercise database.
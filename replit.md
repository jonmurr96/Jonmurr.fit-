# Jonmurr.fit - AI Fitness Coach

## Overview
Jonmurr.fit is an AI-powered fitness tracking application built with React, TypeScript, and Vite. Its core purpose is to provide personalized workout planning and meal suggestions using Google's Gemini AI. The project aims to gamify the fitness journey through XP, leveling, and challenges, offering a comprehensive solution for users to track progress and achieve their health goals.

## User Preferences
None documented yet - this is a fresh import.

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
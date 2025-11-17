# Jonmurr.fit - AI Fitness Coach

## Overview
Jonmurr.fit is an AI-powered fitness tracking application that provides personalized workout planning and meal suggestions using Google's Gemini AI. Built with React, TypeScript, and Vite, the project aims to gamify the fitness journey through XP, leveling, and challenges, offering a comprehensive solution for users to track progress and achieve health goals. The business vision is to provide an engaging, personalized fitness solution that leverages AI for tailored guidance and gamification for sustained user engagement, standing out in the market.

## User Preferences
- **Meal Plans Favor Training Day Macros**: AI-generated meal plans use training day macro targets (+10% calories, +5% protein, +15% carbs) instead of rest day targets to better support workout performance and recovery.

## System Architecture

### UI/UX Decisions
The application features a modern, engaging design with a focus on gamification, utilizing glassmorphism action cards with backdrop blur and gradient overlays. Key elements include a primary AI card highlighted with a green gradient and shimmer effect, microinteractions (hover scale, focus rings, transform animations), and a mobile-first responsive design. The UI incorporates color-coded badges for workout statuses (Active, Inactive, Draft) and tiered progression (Bronze, Silver, Gold, Diamond), alongside gamification elements like level-up modals, XP toasts, badge unlock modals, and mystery chest modals. The Progress Hub uses scroll spy navigation with sticky chip navigation.

### Technical Implementations
- **Frontend**: React 19.2.0 with TypeScript, built using Vite 6.2.0.
- **AI Integration**: Google Gemini API for workout and meal plan generation, optimized for single API calls. Uses gemini-2.5-pro for workout plans (quality) and gemini-2.5-flash for meal plans (speed). Meal plan generation uses exact macro targets from onboarding calculations to ensure AI-generated meals align with user's daily goals.
- **Styling**: Tailwind CSS for rapid and consistent styling.
- **Charts**: Recharts library for data visualization.
- **Database**: Supabase for backend, managing user data, workout logs, meal entries, and gamification state across 23 tables, including a `daily_activity_summary` table for heat map tracking.
- **Authentication**: Supabase Auth for email/password and OAuth (Google/Apple) flows, session management, and protected routes, with a `users` table for user profiles and Row Level Security (RLS) policies. OAuth users get automatic profile creation with unique username generation and collision retry logic.
- **Workout Status System**: Implements 'active', 'inactive', 'draft' statuses for workouts, enforcing a single active plan rule, and smart UI organization.
- **Gamification System**: Features tiered badge progression across 8 categories (Bronze, Silver, Gold, Diamond tiers) with XP rewards, a 100-level system with exponential XP curve, a loot/rewards system with mystery chests, and a challenge system (weekly, monthly, recovery). XP is triggered by workouts, meals, water tracking, and AI usage.
- **Heat Map System**: Daily activity tracking with a 6-tier color-coding system (Gray, Red, Orange, Green, Diamond, Blue) visualized in MiniHeatMap (14-day strip) and FullHeatMap (monthly calendar) components, with a DayDetailModal for comprehensive daily activity breakdown.
- **Onboarding System**: Comprehensive 5-step personalized onboarding flow (PersonalInfo, FitnessGoals, BodyType, WorkoutPreferences, DietLifestyle, Smart Summary) with scientific calculations (BMR, TDEE, macros, water intake) and database integration for storing responses. Calculated macro targets are passed to AI meal plan generation to ensure generated meal plans exactly match user's daily calorie and macro goals (±3% tolerance).

### Feature Specifications
- **Daily Macro Tracking**: Users can log and track calories, protein, carbohydrates, and fats.
- **AI-Powered Planning**: Generation of personalized workout routines and meal plans during onboarding with parallel AI generation using `Promise.allSettled`.
- **Manual Meal Plan Builder**: Users can create custom meal plans from scratch using the 60-food catalog, with category browsing, search, real-time macro calculations, and serving size adjustments. Manual plans integrate seamlessly with the same activation and swap systems as AI-generated plans.
- **Food Swap Catalog System**: Interactive meal plan customization with a curated catalog of 60 foods across protein/carbs/fats categories. Features include real-time food swapping with automatic macro recalculation, category-based filtering, search functionality, favorites management, and swap history tracking. Works with both AI-generated and manually-created meal plans.
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
- **Database Service Architecture**: All 8 database services use a factory pattern (`createXService(userId)`) with closure-based functions for multi-user support and Row Level Security (RLS) enforcement. All services are refactored to eliminate `this` bindings, capturing `userId` from the factory scope. A `useUserServices` hook provides authenticated, user-scoped database service instances.
- **Food Catalog System**: Implements a curated food database (`food_catalog` table) with 60 foods categorized by primary macro (protein/carbs/fats), including serving sizes, complete nutritional data, and tags. User preferences (`user_food_preferences` table) track favorites, blacklisted items, and swap history for personalized recommendations. The FoodSwapModal component provides category-filtered swapping with side-by-side macro comparison and automatic meal plan recalculation with deep immutable state updates.

## Recent Changes
### November 17, 2025 - Manual Meal Plan Builder UI/UX Redesign Complete
- **Modular Component Architecture**: Created 4 reusable components (MacroSummaryCard, FoodCard, SearchBar, PlanPreview) for better maintainability and code organization.
- **ManualMealPlanBuilderV2**: Complete mobile-first redesign with tab navigation (Browse Foods / Your Plan), sticky macro panel, keyboard-aware bottom actions.
- **Mobile Optimization**: Implemented visualViewport API for keyboard detection, 100dvh dynamic viewport height, safe-area inset support, and webkit touch scrolling.
- **Enhanced UX**: Meal slot selector defaults to Breakfast with visual feedback, category filters (Protein/Carbs/Fats), search debouncing (300ms), whole foods filter toggle.
- **Touch-Friendly UI**: Large tap targets, proper spacing, smooth transitions, and responsive grid layout optimized for mobile devices.
- **Keyboard Handling**: Dynamic bottom bar positioning, content padding adjustments, and fallback support for browsers without visualViewport.

### November 17, 2025 - Food Search Database Setup Complete + Whole Foods Filter
- **Database Migration Applied**: Successfully created `usda_foods_index`, `food_catalog`, and `user_food_preferences` tables in production Supabase database.
- **Food Catalog Seeded**: Populated `food_catalog` with 60 curated Quick Pick foods (20 protein, 20 carbs, 20 fats) with complete nutritional data.
- **USDA Index Populated**: Successfully seeded `usda_foods_index` with 1,632 USDA foods via bulk ingestion (913 carbs, 340 protein, 237 fats, 142 other).
- **Row Level Security Fixed**: Added INSERT and UPDATE policies to allow seeding while maintaining read-only access for users.
- **Search System Live**: Local food search now operational with 1,692 total searchable foods (60 Quick Picks + 1,632 USDA foods).
- **Whole Foods Filter**: Added smart filtering to show Foundation + SR Legacy whole foods by default, hiding branded/fast food items (e.g., show "Chicken Breast" instead of "Chick-fil-A"). Users can toggle 🥗 Whole Foods / 🍔 All Foods to include branded items when needed.
- **Mobile Scroll Fixed**: Resolved webkit overflow scrolling issues in ManualMealPlanBuilder for smooth iOS/mobile scrolling.
- **Performance**: Food searches complete in <100ms using PostgreSQL full-text + trigram search with hybrid fallback.

### November 14, 2025 - Production Fixes and Feature Enhancements
- **Environment Variable Migration**: Migrated all services from `process.env.*` to `import.meta.env.VITE_*` to fix import-time crashes preventing Gemini API calls (workout/meal generation). Added comprehensive TypeScript support via vite-env.d.ts. All 11 Gemini functions now gracefully handle missing API keys with appropriate fallbacks.
- **USDA Search Rebuild**: Implemented multi-stage filtering pipeline with hard ban list (baby food, infant formula, crackers, flour, processed foods), soft penalty system (canned/frozen/seasoned), and weighted relevance scoring (term coverage +25, headword alignment +30, data type priority: Foundation > SR Legacy > Branded). Enhanced canonical food detection (≤45 chars, ≤3 segments, simple descriptions) and improved deduplication. Restored Branded food support for future barcode scanning.
- **Photo Recognition Integration**: Added camera buttons to all meal sections in ManualMealPlanBuilder (Breakfast, Lunch, Dinner, Snacks). Integrated existing `logFoodWithPhoto()` Gemini API function for nutrition label OCR and visual food recognition. Implemented race-condition-safe state management using functional updaters. Mobile camera support with `capture="environment"` attribute.
- **Quick Add Management**: Implemented hide/unhide functionality for catalog foods with eye icon toggles. Multi-hide support with ref-based timeout management providing independent 5-second undo windows per food. Toast notifications show all pending hides with individual and bulk undo buttons. "Show Hidden" toggle allows viewing and restoring hidden foods. Persists to `user_food_preferences.blacklisted_foods` array. USDA foods excluded from hide functionality (search-only).

### November 14, 2025 - Custom USDA Food Search Index
- **Local Food Index**: Built custom search index (`usda_foods_index` table) with 1500+ preprocessed USDA foods stored locally in Supabase for dramatically improved search accuracy and speed.
- **Hybrid Search Algorithm**: Implemented PostgreSQL full-text search (tsvector) + trigram similarity with custom multi-factor scoring (exact match +50, cooking method detection +20, canonicality +15, data type priority).
- **Bulk Ingestion System**: Created CLI script (`scripts/usda_seed_loader.ts`) that fetches foods using 165 targeted keywords, applies smart filtering (relaxed to allow cereals/branded staples), detects preparation methods, tags canonical foods, and deduplicates by normalized name.
- **Intelligent Fallback**: Wrapper service checks if index is populated, routes to local search when available, falls back to live USDA API when index returns 0 results (handles ingestion gaps).
- **Search Improvements**: Queries now return relevant results - "white rice" returns simple white rice (not "Adobo with rice"), "chicken breast cooked" returns cooked chicken (not raw), preparation methods properly detected.
- **Performance**: Local searches complete in <100ms vs 500-1000ms for live API calls, deterministic results, offline-capable.
- **Setup**: Run `npm run seed:usda` to populate index, migration adds trigram indexes and search function. See `USDA_FOOD_INDEX_SETUP.md` for complete documentation.

### November 13, 2025 - USDA Food Database Integration
- **USDA FoodData Central API**: Integrated free USDA API (1,000 requests/hour) for real-time food search with 1000+ foods
- **Enhanced Food Search**: ManualMealPlanBuilder and FoodSwapModal now search USDA database when users type (300ms debounce)
- **Quick Picks + USDA**: 60-food catalog serves as curated quick picks; USDA search activates on typing
- **Type-Safe Conversions**: Added convertSimplifiedToFoodItem() to ensure USDA foods work properly in swap system
- **Training Day Macros**: Fixed onboarding to generate meal plans with training day macros (+10% calories, +5% protein, +15% carbs)
- **UI Enhancements**: Added USDA badges, loading spinners, and contextual help text for food search
- **Backward Compatibility**: Maintained full compatibility with existing 60-food catalog system

## External Dependencies
- **Google Gemini API**: Used for AI-driven workout and meal plan generation.
- **Supabase**: Backend-as-a-service for database management, authentication, and real-time features.
- **WGER API**: Provides access to a comprehensive exercise database.
- **USDA FoodData Central API**: Free nutrition database with 1000+ foods for meal planning and food swapping.
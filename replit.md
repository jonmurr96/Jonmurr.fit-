# Jonmurr.fit - AI Fitness Coach

## Overview
This is an AI-powered fitness tracking application built with React, TypeScript, and Vite. It uses Google's Gemini AI for intelligent workout planning and meal suggestions.

**Current State**: Successfully configured for Replit environment and ready to run.

## Recent Changes (Nov 9, 2025)
- **GitHub Import Setup**: Configured the project to run in Replit environment
- **Port Configuration**: Changed dev server from port 3000 to 5000 for Replit webview compatibility
- **Security Update**: Moved WGER_API_KEY from hardcoded value to environment variable
- **Proxy Configuration**: Added `allowedHosts: true` to Vite config for Replit's iframe proxy
- **Deployment**: Configured autoscale deployment with Vite preview server
- **Dependencies**: All npm packages installed successfully

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
- `components/` - Reusable UI components
- `screens/` - Main application screens (Home, Train, Log, Progress, Coach)

### Environment Variables
- `GEMINI_API_KEY` - Required for AI features (get from https://aistudio.google.com/app/apikey)
- `WGER_API_KEY` - Required for exercise database (get from https://wger.de/en/software/api)

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

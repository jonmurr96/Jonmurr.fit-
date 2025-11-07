<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Jonmurr.fit - AI-Powered Fitness Tracker

A comprehensive fitness tracking application powered by Google's Gemini AI and Supabase backend.

View your app in AI Studio: https://ai.studio/apps/drive/1BqrPYJOrVsSHdjGbGD7Jh0Qtgam4uCC2

## 🚀 Features

### AI-Powered
- **Workout Plan Generation**: Get personalized workout programs based on your goals, experience, and equipment
- **Meal Plan Generation**: AI-generated nutrition plans tailored to your dietary needs
- **Food Logging**: Log meals using natural language or by taking photos
- **AI Coach**: Ask fitness and nutrition questions to get expert advice

### Tracking & Progress
- **Nutrition Tracking**: Log meals, track macros (calories, protein, carbs, fat)
- **Workout Logging**: Track workouts, sets, reps, and progressive overload
- **Weight Tracking**: Monitor weight changes over time with visual charts
- **Water Intake**: Track daily hydration with streak tracking
- **Progress Photos**: Upload and compare progress photos
- **Milestones**: Celebrate achievements and track consistency

### Advanced Features
- **Streak Tracking**: Automatic tracking of workout, nutrition, and water streaks
- **Multi-device Sync**: Your data syncs across all devices in real-time
- **Workout Library**: Save and organize your favorite workouts
- **Exercise Database**: Search from thousands of exercises
- **Progressive Overload**: AI-powered suggestions for progression
- **Macro Auto-adjust**: Automatically adjust macros for training vs rest days

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS
- **AI**: Google Gemini 2.5 (Pro & Flash models)
- **Backend**: Supabase (PostgreSQL, Real-time, Auth)
- **Charts**: Recharts
- **Exercise API**: WGER Exercise Database

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account ([sign up free](https://supabase.com))
- Google AI Studio API key ([get one free](https://ai.google.dev/))

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up Supabase** (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions)
   - Create a Supabase project
   - Run database migrations
   - Get your project URL and anon key

3. **Configure environment**

   Update `.env.local`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the app**
   ```bash
   npm run dev
   ```

5. **Open** `http://localhost:3000`

## 🔐 Authentication

- Sign up with email and password
- Your profile, settings, and streaks are created automatically
- All data is private and secured with Row Level Security

## 📊 Database

17 tables including:
- `profiles`, `macro_targets`, `user_settings`
- `meals`, `food_items`, `water_logs`, `weight_logs`
- `training_programs`, `saved_workouts`, `workout_history`
- `streaks`, `milestones`, `photo_bundles`

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for full schema details.

## 📚 Documentation

- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Database setup guide
- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Backend integration details
- **[.env.example](./.env.example)** - Environment variables template

## 🐛 Troubleshooting

**Missing environment variables**: Ensure `.env.local` exists and restart dev server

**Authentication not working**: Check Supabase dashboard → Authentication → Users

**Data not syncing**: Verify you're logged in and check browser console for errors

## 📱 Real-time Sync

All data syncs across devices instantly using Supabase real-time subscriptions.

## 🙏 Credits

Built with Google Gemini AI, Supabase, React, and WGER Exercise API.

---

**Built with ❤️ by Jon Murray**

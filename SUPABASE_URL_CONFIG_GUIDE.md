# Fix Email Confirmation Redirect URLs

## Problem
When users click the email confirmation link, it tries to redirect to `localhost` instead of your Replit app URL, causing "Safari can't open the page" errors.

## Solution
Configure Supabase with your Replit app's URL.

---

## Step 1: Get Your Replit App URL

Your app is hosted at:
```
https://67f27aa5-ee00-47ef-8633-e3229bbb2aa5-00-3kotx3cbsrvid.riker.replit.dev
```

---

## Step 2: Configure Supabase Site URL

1. **Open Supabase Dashboard**
   - Go to your Supabase project: https://supabase.com/dashboard

2. **Navigate to Authentication Settings**
   - Click on **Authentication** in the left sidebar
   - Click on **URL Configuration**

3. **Set Site URL**
   - Find the **Site URL** field
   - Replace `http://localhost:3000` with:
     ```
     https://67f27aa5-ee00-47ef-8633-e3229bbb2aa5-00-3kotx3cbsrvid.riker.replit.dev
     ```
   - Click **Save**

4. **Add Redirect URLs**
   - Scroll down to **Redirect URLs** section
   - Add these URLs (one per line):
     ```
     https://67f27aa5-ee00-47ef-8633-e3229bbb2aa5-00-3kotx3cbsrvid.riker.replit.dev/**
     http://localhost:5000/**
     http://localhost:5001/**
     ```
   - The `**` wildcard allows all paths under that domain
   - Click **Save**

---

## Step 3: Test Email Confirmation

After updating the URLs:

1. **Create a new test account** (the old confirmation link won't work)
   - Use a different email: `testuser2@gmail.com`
   - Different username: `TestUser2`

2. **Check your email** for the confirmation link

3. **Click "Confirm your mail"** - should now redirect correctly to your app

4. **Complete onboarding** - you should see the onboarding flow

---

## Important Notes

- **Replit Domain Changes**: If you deploy or the domain changes, update the Site URL again
- **Publishing**: When you publish your app, add the production URL to Redirect URLs
- **Local Development**: Keep `localhost:5000` in Redirect URLs for local testing

---

## Alternative: Disable Email Confirmation (Development Only)

If you want to skip email confirmation during development:

1. Supabase Dashboard → **Authentication** → **Providers**
2. Scroll to **Email** provider
3. Toggle **Confirm email** to OFF
4. Click **Save**

⚠️ **Warning**: Only do this for development. Always require email confirmation in production.

---

## Current Status

✅ **Sign-up working** - Account creation successful  
✅ **Database trigger working** - User profiles created automatically  
⚠️ **Email confirmation redirect** - Needs URL configuration (follow steps above)

Once you configure the Site URL and Redirect URLs in Supabase, email confirmations will work perfectly!

# Google/Apple OAuth Setup Guide

## ✅ What's Been Implemented

Your application now has **complete OAuth support** for Google and Apple sign-in! Here's what's ready:

### Backend Implementation
- **OAuth Methods**: `signInWithGoogle()` and `signInWithApple()` in authService
- **Automatic Profile Creation**: New OAuth users get user profiles automatically created with:
  - Full name from OAuth provider
  - Avatar URL from OAuth provider
  - Guaranteed unique username (email prefix + random 6-char suffix)
  - Username collision retry logic (up to 5 attempts)
  - `onboarding_complete: false` (ensures they go through onboarding)

### Frontend Implementation
- **Branded OAuth Buttons**: Google and Apple sign-in buttons with proper styling
- **UI Integration**: OAuth buttons added to both Sign In and Sign Up screens
- **Visual Separator**: Clean "or" divider between email/password and OAuth options

### Architecture
- **Multi-User Ready**: OAuth users automatically isolated via RLS policies (once applied)
- **Session Management**: Uses Supabase Auth for secure token handling
- **Redirect Flow**: Proper OAuth callback handling with redirectTo parameter

---

## 🔧 Required Manual Setup (2 Steps)

You need to complete **two manual configurations** in the Supabase Dashboard to activate OAuth:

### Step 1: Apply Row-Level Security (RLS) Policies

**Why**: Ensures OAuth users' data is isolated and secure across all 27 tables

**How**:
1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire contents of `supabase/migration_rls_policies.sql`
6. Paste into the SQL Editor
7. Click **Run** (or press `Ctrl/Cmd + Enter`)
8. ✅ Verify: Should see "Success. No rows returned"

**File Location**: `supabase/migration_rls_policies.sql` (already created)

**Note**: This is a transactional migration (BEGIN/COMMIT wrapper) - it will either fully succeed or fully rollback if any error occurs.

---

### Step 2: Configure OAuth Providers

#### A. Google OAuth Setup

**1. Create Google OAuth Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing project
   - Navigate to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: "Jonmurr.fit" (or your preferred name)
   - **Authorized redirect URIs**: Add your Supabase callback URL:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
     (Replace `YOUR_PROJECT_REF` with your actual Supabase project reference)
   - Click **Create**
   - ✅ Copy the **Client ID** and **Client Secret**

**2. Enable Google OAuth in Supabase**:
   - Open [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Go to **Authentication** → **Providers** (left sidebar)
   - Find **Google** in the provider list
   - Toggle **Enable Sign in with Google** to ON
   - Paste your **Client ID** from step 1
   - Paste your **Client Secret** from step 1
   - Click **Save**

**3. Configure Scopes** (Recommended):
   - In Supabase Google settings, ensure these scopes are enabled:
     - `openid` (required)
     - `email` (required)
     - `profile` (recommended - for avatar and name)

---

#### B. Apple OAuth Setup

**1. Create Apple Sign In Service**:
   - Go to [Apple Developer Portal](https://developer.apple.com/account)
   - Navigate to **Certificates, Identifiers & Profiles**
   - Click **Identifiers** → **+** (Add new)
   - Select **App IDs** → Click **Continue**
   - Select **App** → Click **Continue**
   - Fill in:
     - Description: "Jonmurr.fit"
     - Bundle ID: Your app's bundle ID (e.g., `com.jonmurr.fit`)
   - Check **Sign in with Apple** capability
   - Click **Continue** → **Register**

**2. Create Services ID**:
   - Navigate to **Identifiers** → **+** (Add new)
   - Select **Services IDs** → Click **Continue**
   - Fill in:
     - Description: "Jonmurr.fit Web"
     - Identifier: `com.jonmurr.fit.web` (must be unique)
   - Check **Sign in with Apple**
   - Click **Configure** next to Sign in with Apple
   - Primary App ID: Select the App ID from step 1
   - **Domains and Subdomains**: Add your Supabase domain:
     ```
     YOUR_PROJECT_REF.supabase.co
     ```
   - **Return URLs**: Add your Supabase callback URL:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
   - Click **Save** → **Continue** → **Register**

**3. Create Private Key**:
   - Navigate to **Keys** → **+** (Add new)
   - Key Name: "Jonmurr.fit Sign in with Apple Key"
   - Check **Sign in with Apple**
   - Click **Configure**
   - Primary App ID: Select your App ID
   - Click **Save** → **Continue** → **Register**
   - ✅ **Download the .p8 key file** (you can only download once!)
   - ✅ Note your **Key ID** (shown in the keys list)
   - ✅ Note your **Team ID** (top-right corner of developer portal)

**4. Enable Apple OAuth in Supabase**:
   - Open [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Go to **Authentication** → **Providers**
   - Find **Apple** in the provider list
   - Toggle **Enable Sign in with Apple** to ON
   - Fill in:
     - **Services ID**: Your Services ID from step 2 (e.g., `com.jonmurr.fit.web`)
     - **Team ID**: From step 3
     - **Key ID**: From step 3
     - **Private Key**: Copy the contents of the .p8 file from step 3
   - Click **Save**

---

## 🧪 Testing OAuth Flow

Once providers are configured, test the complete OAuth flow:

### Google Sign-In Test:
1. Go to your app's Sign In screen
2. Click the **Continue with Google** button
3. Select your Google account
4. Grant permissions
5. ✅ Should redirect back to your app
6. ✅ Should automatically create user profile with:
   - Full name from Google
   - Avatar from Google
   - Unique username (e.g., `jane_abc123`)
7. ✅ Should show onboarding screen (since `onboarding_complete: false`)

### Apple Sign-In Test:
1. Go to your app's Sign In screen
2. Click the **Continue with Apple** button
3. Authenticate with Face ID/Touch ID/Password
4. Choose whether to share email (Hide My Email or Share Email)
5. ✅ Should redirect back to your app
6. ✅ Should automatically create user profile
7. ✅ Should show onboarding screen

### Verify Data Isolation:
1. Sign in with OAuth (Google or Apple)
2. Complete onboarding
3. Create some workouts, log meals, track progress
4. Sign out
5. Sign in with a different OAuth account
6. ✅ Should see empty dashboard (data isolated)
7. ✅ Should go through onboarding again

---

## 🔍 Troubleshooting

### OAuth Button Doesn't Work
- **Check Console**: Open browser DevTools → Console tab for errors
- **Verify Provider Configuration**: Ensure OAuth providers are enabled in Supabase Dashboard
- **Check Redirect URL**: Must match exactly in both Google/Apple and Supabase settings

### User Profile Not Created
- **Check RLS Policies**: Ensure `migration_rls_policies.sql` was applied successfully
- **Check Logs**: Look for "Creating profile for OAuth user" in browser console
- **Check Username**: If you see duplicate username errors, the retry logic should handle it

### Username Collisions (Rare)
- **Automatic Retry**: System tries up to 5 times with new random suffixes
- **Check Logs**: Look for "Username collision, retrying..." messages
- **Manual Intervention**: If all 5 attempts fail, user will see error and can retry sign-in

### Redirect Loop
- **Check Callback URL**: Ensure Supabase callback URL is added to Google/Apple settings
- **Check redirectTo**: Should be your app's domain (e.g., `https://your-repl.replit.dev`)

---

## 📊 What Happens Behind the Scenes

### OAuth Sign-In Flow:
```
1. User clicks "Continue with Google/Apple"
   ↓
2. Supabase redirects to OAuth provider
   ↓
3. User authenticates and grants permissions
   ↓
4. OAuth provider redirects back to Supabase callback
   ↓
5. Supabase creates auth.users record
   ↓
6. App redirects to your domain
   ↓
7. AuthContext detects new session
   ↓
8. Tries to load user_profile from database
   ↓
9. If not found, automatically creates profile:
   - Extract full_name from OAuth metadata
   - Extract avatar_url from OAuth metadata
   - Generate unique username with random suffix
   - Set onboarding_complete = false
   - Retry up to 5 times if username collision
   ↓
10. User sees onboarding screen
```

### Username Generation:
```
Email: jane.doe@gmail.com
       ↓
Sanitize: janedoe (remove special chars)
       ↓
Add random suffix: janedoe_abc123
       ↓
If collision: janedoe_xyz789 (retry with new suffix)
       ↓
Final username: janedoe_abc123
```

---

## 📝 Support Notes

### For Support Teams:
- **Username Format**: OAuth usernames have format `emailprefix_randomsuffix` (e.g., `jane_abc123`)
- **Collision Handling**: System automatically retries up to 5 times with new random suffixes
- **Profile Creation**: Happens automatically on first sign-in, no manual intervention needed
- **Onboarding**: All OAuth users go through onboarding (can be skipped if needed)

### For Developers:
- **RLS Policies**: All 27 tables have policies enforcing user isolation via `auth.uid()`
- **Username Uniqueness**: Uses base-36 random suffixes (6 chars = ~2 billion possibilities)
- **Error Codes**: Watch for `23505` (unique constraint) and `PGRST116` (row not found)
- **Retry Logic**: Exponential backoff in AuthContext for profile loading

---

## ✨ Next Steps

After completing the manual setup above:

1. ✅ Apply RLS migration (Step 1)
2. ✅ Configure Google OAuth (Step 2A)
3. ✅ Configure Apple OAuth (Step 2B)
4. 🧪 Test both OAuth flows
5. 🚀 Deploy to production

**All code is production-ready** - no additional development needed!

---

## 📚 Files Modified

- `services/authService.ts` - OAuth methods + profile creation
- `contexts/AuthContext.tsx` - Automatic profile creation for OAuth users
- `components/OAuthButtons.tsx` - Google/Apple button components
- `screens/auth/SignInScreen.tsx` - Added OAuth buttons
- `screens/auth/SignUpScreen.tsx` - Added OAuth buttons
- `supabase/migration_rls_policies.sql` - RLS policies (ready to apply)

---

**Questions?** Check the browser console for detailed logs during OAuth sign-in!

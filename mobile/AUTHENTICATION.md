# Authentication Setup Guide

## Overview

LockdIn uses Supabase Auth for authentication with Google and Apple Sign In providers.

## Prerequisites

- Supabase project created
- Google Cloud Console account
- Apple Developer account (for Apple Sign In)

## Supabase Configuration

### 1. Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy:
   - Project URL
   - Anon/Public key

4. Add to mobile app `.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Configure Redirect URLs

In Supabase Dashboard > Authentication > URL Configuration:

Add these redirect URLs:
```
# For development
exp://localhost:8081/--/auth/callback
lockdinapp://auth/callback

# For production (after building)
lockdinapp://auth/callback
```

## Google OAuth Setup

### 1. Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth Client ID

### 2. Configure OAuth Consent Screen

1. Set application name: "LockdIn"
2. Add logo (optional)
3. Add authorized domains
4. Add scopes: email, profile, openid

### 3. Create OAuth Client IDs

Create **three** OAuth client IDs:

#### Web Application (for Supabase)
- Application type: Web application
- Name: LockdIn Web Client
- Authorized redirect URIs:
  ```
  https://your-project.supabase.co/auth/v1/callback
  ```
- Copy Client ID and Client Secret

#### iOS Application
- Application type: iOS
- Name: LockdIn iOS
- Bundle ID: `com.lockdin.app`

#### Android Application
- Application type: Android
- Name: LockdIn Android  
- Package name: `com.lockdin.app`
- Get SHA-1 certificate fingerprint:
  ```bash
  # For debug build
  keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
  ```

### 4. Configure in Supabase

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable Google provider
3. Enter Client ID and Client Secret from Web Application
4. Save

## Apple Sign In Setup

### 1. Apple Developer Configuration

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Certificates, Identifiers & Profiles
3. Create App ID:
   - Description: LockdIn
   - Bundle ID: `com.lockdin.app`
   - Enable Sign In with Apple capability

### 2. Create Service ID

1. Register a new Services ID
2. Identifier: `com.lockdin.app.service`
3. Enable Sign In with Apple
4. Configure:
   - Primary App ID: Select your app's Bundle ID
   - Return URLs:
     ```
     https://your-project.supabase.co/auth/v1/callback
     ```

### 3. Create Key

1. Keys > Create new key
2. Name: LockdIn Auth Key
3. Enable Sign in with Apple
4. Download the key file (.p8)
5. Note the Key ID

### 4. Configure in Supabase

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable Apple provider
3. Enter:
   - Client ID: Your Services ID (`com.lockdin.app.service`)
   - Team ID: From Apple Developer Account
   - Key ID: From the key you created
   - Private Key: Contents of the .p8 file
4. Save

## Testing Authentication

### Development Testing

1. Start Expo dev server:
```bash
cd mobile
npm start
```

2. Test on device or simulator:
```bash
# iOS
npm run ios

# Android
npm run android
```

3. Tap "Continue with Google" or "Continue with Apple"
4. Complete OAuth flow in browser
5. Should redirect back to app with authenticated session

### Troubleshooting

#### Redirect not working
- Verify scheme in `app.json` matches: `lockdinapp`
- Check Supabase redirect URLs are configured
- Clear app data and try again

#### Google Sign In fails
- Verify OAuth client IDs are created for all platforms
- Check Client ID and Secret in Supabase match Web Application credentials
- Ensure Google+ API is enabled in Google Cloud Console

#### Apple Sign In fails
- Verify Services ID is properly configured
- Check return URLs match Supabase project URL
- Ensure .p8 key is valid and Key ID is correct
- App Bundle ID must match registered App ID

## Session Management

The app automatically:
- Saves session securely using Expo SecureStore
- Refreshes tokens automatically
- Persists session across app restarts
- Handles session expiration

## Next Steps

After authentication is working:
1. Implement onboarding flow
2. Create user profile in `user_profiles` table
3. Set up deep linking for OAuth callbacks
4. Add sign out functionality
5. Implement session monitoring

## Security Notes

- Never commit `.env` files with real credentials
- Use `.env.example` for documentation only
- Store OAuth secrets securely
- Rotate keys periodically
- Monitor authentication logs in Supabase dashboard

# Supabase OAuth Setup 3. Add the following **Redirect URIs**:
   ```
   https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
   melodi://auth-callback
   ```
   Replace `YOUR_SUPABASE_PROJECT_REF` with your actual Supabase project reference.
   
   **Important**: Only add these two URIs. Do not add localhost URLs as they don't correspond to actual pages in your app.otify Integration

This guide will help you set up Spotify OAuth authentication with Supabase for your Melodi app.

## Prerequisites

1. A Supabase project (create one at [supabase.com](https://supabase.com))
2. A Spotify Developer App (create one at [developer.spotify.com](https://developer.spotify.com/dashboard))

## Step 1: Configure Spotify OAuth in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication > Providers**
3. Find **Spotify** in the list and enable it
4. You'll need to add your Spotify app credentials:
   - **Client ID**: Get this from your Spotify app dashboard
   - **Client Secret**: Get this from your Spotify app dashboard

## Step 2: Configure Spotify App

1. Go to your [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click on your app or create a new one
3. Go to **Settings**
4. Add the following **Redirect URIs**:
   ```
   https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
   melodi://auth-callback
   ```
   Replace `YOUR_SUPABASE_PROJECT_REF` with your actual Supabase project reference.

## Step 3: Update Environment Variables

Make sure your `.env` file contains:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 4: Test the Integration

1. Run your app: `npm start`
2. Navigate to the login or signup screen
3. Tap "Continue with Spotify"
4. You should be redirected to Spotify for authentication
5. After successful authentication, you'll be redirected back to your app

## Spotify Scopes

The app requests the following Spotify permissions:
- `user-read-email`: Access to user's email address
- `user-read-private`: Access to user's profile information
- `user-library-read`: Access to user's saved tracks
- `user-read-recently-played`: Access to recently played tracks
- `user-top-read`: Access to user's top tracks and artists
- `playlist-read-private`: Access to private playlists
- `playlist-read-collaborative`: Access to collaborative playlists

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI"**
   - Make sure you've added the correct redirect URIs in your Spotify app settings
   - Check that your Supabase project URL is correct

2. **"OAuth flow cancelled"**
   - This usually means the user closed the browser or cancelled the authentication
   - The app handles this gracefully

3. **"No valid tokens found"**
   - This might indicate an issue with the OAuth callback processing
   - Check the app logs for more details

### Deep Link Issues:

If deep linking isn't working:
1. Make sure your app.json has the correct scheme: `"scheme": "melodi"`
2. Test the deep link manually: `npx uri-scheme open melodi://auth-callback --ios` or `--android`

## Security Notes

- Never commit your Spotify Client Secret to version control
- The Client Secret should only be configured in Supabase, not in your app
- Supabase handles the secure token exchange
- Tokens are automatically stored securely using AsyncStorage

## Using Spotify Data

Once authenticated, you can access Spotify user data through the Supabase session:

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, session } = useAuth();
  
  // The session contains Spotify access tokens
  if (session?.provider_token) {
    // Use this token to make Spotify API calls
    console.log('Spotify access token:', session.provider_token);
  }
}
```
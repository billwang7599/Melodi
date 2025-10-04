# Spotify OAuth Redirect URI Troubleshooting

## Issue: "INVALID_CLIENT: Invalid redirect URI"

This error occurs when the redirect URI in your request doesn't match what's configured in your Spotify app.

## Quick Fix Steps:

### 1. Check Your Spotify App Settings

Go to your [Spotify Developer Dashboard](https://developer.spotify.com/dashboard):

1. Select your app
2. Click "Settings" 
3. In the "Redirect URIs" section, make sure you have ALL of these URIs:

```
https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
http://localhost:8081/auth-callback
melodi://auth-callback
```

**Replace `YOUR_SUPABASE_PROJECT_REF` with your actual Supabase project reference from your `.env` file.**

### 2. Find Your Supabase Project Reference

Your Supabase URL looks like: `https://abcdefghijk.supabase.co`
The project reference is the part before `.supabase.co` (e.g., `abcdefghijk`)

### 3. Add All Redirect URIs

**Required URIs:**
- `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` (Supabase OAuth endpoint)
- `melodi://auth-callback` (Deep link for your app)

**Note:** We no longer use localhost URLs as they don't correspond to actual pages in your app.

### 4. Save and Wait

After adding the URIs in Spotify:
1. Click "Save"
2. Wait 2-3 minutes for changes to propagate
3. Try the OAuth flow again

## Development vs Production

### Development (Expo CLI)
- Uses `http://localhost:8081/auth-callback`
- The app automatically detects this environment

### Production (Standalone App)  
- Uses `melodi://auth-callback`
- Deep link scheme from app.json

## Debugging Steps

1. **Check the redirect URL being used:**
   ```javascript
   // Look for this log in your console
   console.log('OAuth redirect URL:', redirectUrl);
   ```

2. **Verify your environment:**
   ```javascript
   // Check if running in development
   console.log('Development mode:', __DEV__);
   console.log('Linking URL:', Linking.createURL(''));
   ```

3. **Check callback URL:**
   ```javascript  
   // Look for this log when redirect happens
   console.log('Processing OAuth callback URL:', url);
   ```

## Common Issues

### Deep Link Not Working
If the deep link `melodi://auth-callback` isn't working:
- Make sure `app.json` has `"scheme": "melodi"`
- Restart your Expo development server
- Clear app data and try again

### Supabase URL Wrong
Double-check your `.env` file:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
```

The Spotify redirect URI should be:
```
https://your-project-ref.supabase.co/auth/v1/callback
```

## Testing Steps

1. **Clear app data** (restart Expo CLI)
2. **Try OAuth flow**
3. **Check console logs** for redirect URL
4. **Verify that URL is in Spotify settings**
5. **Wait 2-3 minutes after adding new URIs**

## Still Having Issues?

1. Try clearing browser cache
2. Restart Expo CLI (`npm start`)
3. Check if Spotify app is in "Development Mode" 
4. Verify client ID and secret in Supabase dashboard
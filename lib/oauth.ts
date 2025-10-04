import * as WebBrowser from 'expo-web-browser';
import { logOAuthDebugInfo } from './debug-oauth';
import { getSupabase } from './supabase';

// Complete the OAuth flow in WebBrowser
WebBrowser.maybeCompleteAuthSession();

export const handleSpotifyOAuth = async () => {
  try {
    const supabaseClient = getSupabase();
    
    // Log debug information
    const debugInfo = logOAuthDebugInfo();
    
    // Use deep link scheme for OAuth redirect
    const redirectUrl = 'melodi://auth-callback';
    
    console.log('Starting Spotify OAuth flow...');
    console.log('Using OAuth redirect URL:', redirectUrl);
    
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        redirectTo: redirectUrl,
        scopes: [
          'user-read-email',
          'user-read-private', 
          'user-library-read',
          'user-read-recently-played',
          'user-top-read',
          'playlist-read-private',
          'playlist-read-collaborative'
        ].join(' ')
      }
    });

    if (error) {
      console.error('Supabase OAuth error:', error);
      throw error;
    }

    // Open the OAuth URL in a browser
    if (data.url) {
      console.log('Opening OAuth URL:', data.url);
      
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl
      );
      
      console.log('WebBrowser result type:', result.type);
      if (result.type === 'success') {
        console.log('WebBrowser result url:', (result as any).url);
      }
      
      if (result.type === 'success' && (result as any).url) {
        console.log('OAuth flow completed successfully, callback URL received');
        // Don't process the callback here - let the deep link handler do it
        return { 
          success: true, 
          url: (result as any).url
        };
      } else if (result.type === 'cancel') {
        console.log('OAuth flow was cancelled by user');
        return { success: false, error: 'OAuth flow was cancelled by user' };
      } else {
        console.log('OAuth flow failed or was dismissed');
        return { success: false, error: 'OAuth flow failed or was dismissed' };
      }
    }

    return { success: false, error: 'No OAuth URL received' };
  } catch (error) {
    console.error('OAuth error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
};

export const handleOAuthCallback = async (url: string) => {
  try {
    const supabaseClient = getSupabase();
    console.log('Processing OAuth callback URL:', url);
    
    // Parse the URL to extract any parameters
    const parsedUrl = new URL(url);
    
    // Check both hash fragment and search params
    let params: URLSearchParams;
    
    if (parsedUrl.hash) {
      const fragment = parsedUrl.hash.substring(1);
      params = new URLSearchParams(fragment);
      console.log('Found hash fragment params');
    } else {
      params = new URLSearchParams(parsedUrl.search);
      console.log('Using search params');
    }
    
    // Log all parameters for debugging
    const allParams: Record<string, string> = {};
    params.forEach((value, key) => {
      allParams[key] = value;
    });
    console.log('All callback params:', allParams);
    
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const code = params.get('code');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (error) {
      console.error('OAuth error in callback:', error, errorDescription);
      return { success: false, error: `OAuth error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}` };
    }

    // Check for direct tokens (implicit flow)
    if (access_token && refresh_token) {
      console.log('Direct token flow detected - setting session');
      const { data, error: sessionError } = await supabaseClient.auth.setSession({
        access_token,
        refresh_token,
      });

      if (sessionError) {
        console.error('Session setting error:', sessionError);
        return { success: false, error: sessionError.message };
      }

      console.log('Session set successfully');
      return { success: true, session: data.session };
    } 
    
    // Check for authorization code (code flow)
    if (code) {
      console.log('Authorization code flow detected - exchanging code for tokens');
      try {
        const { data, error: exchangeError } = await supabaseClient.auth.exchangeCodeForSession(code);
        
        if (exchangeError) {
          console.error('Code exchange error:', exchangeError);
          return { success: false, error: exchangeError.message };
        }
        
        console.log('Code exchange successful');
        return { success: true, session: data.session };
      } catch (exchangeError) {
        console.error('Code exchange failed:', exchangeError);
        return { success: false, error: 'Failed to exchange authorization code' };
      }
    }

    // If no tokens or code, this might be a successful redirect without tokens
    // The auth state should be updated by Supabase's background processes
    console.log('No tokens or code found, but no error either. Checking current session...');
    
    // Wait a moment and check if we have a session now
    setTimeout(async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session) {
        console.log('Session found after OAuth callback');
      } else {
        console.log('No session found after OAuth callback');
      }
    }, 1000);

    return { success: true, message: 'OAuth callback processed' };
  } catch (error) {
    console.error('OAuth callback error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process OAuth callback'
    };
  }
};
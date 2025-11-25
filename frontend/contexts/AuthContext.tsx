import { authService } from '@/lib/auth';
import { handleOAuthCallback, handleSpotifyOAuth } from '@/lib/oauth';
import { getSupabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  token: string | null;
  loading: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithSpotify: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabaseClient = getSupabase();

    // Get initial session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session loaded:', session ? 'valid session' : 'no session');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session ? 'with session' : 'no session');

      // Log token refresh events
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Navigate based on auth state
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, syncing to backend and navigating to main app');
        
        // Sync user to backend
        try {
          const syncResult = await authService.syncUserToBackend(session.user);
          if (syncResult.success) {
            console.log('User successfully synced to backend');
          } else {
            console.warn('Failed to sync user to backend:', syncResult.error);
          }
        } catch (error) {
          console.error('Error syncing user to backend:', error);
        }
        
        // Small delay to ensure state is updated
        setTimeout(() => {
          router.replace('/(tabs)/feed');
        }, 100);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, navigating to login');
        router.replace('/(auth)/login');
      }
    });

    // Handle OAuth redirects
    const handleDeepLink = async (url: string) => {
      console.log('Deep link received:', url);
      if (url.includes('auth-callback')) {
        console.log('Processing auth callback...');
        const result = await handleOAuthCallback(url);
        console.log('OAuth callback result:', result);
        
        if (result.success) {
          console.log('OAuth callback successful, session should be updated');
        } else {
          console.error('OAuth callback failed:', result.error);
        }
      }
    };

    // Listen for deep links
    const subscription2 = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.unsubscribe();
      subscription2?.remove();
    };
  }, []);

  const signUp = async (email: string, password: string, username?: string) => {
    try {
      const supabaseClient = getSupabase();
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split('@')[0],
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Note: User sync will happen automatically via the auth state change listener
      // when the user is signed in after email confirmation

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const supabaseClient = getSupabase();
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    }
  };

  const signInWithSpotify = async () => {
    return await handleSpotifyOAuth();
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const supabaseClient = getSupabase();
      
      // Clear app-specific data
      await authService.clearAppData();
      
      // Sign out from Supabase (this will also trigger the auth state change)
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        throw error;
      }
      
      // Clear local state immediately
      setUser(null);
      setSession(null);
      
    } catch (error) {
      console.error('Failed to sign out:', error);
      // Even if there's an error, clear local state to ensure user is logged out
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    token: session?.access_token ?? null,
    loading,
    signUp,
    signIn,
    signInWithSpotify,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
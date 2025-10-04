import { getSupabase } from '@/lib/supabase';

export const authService = {
  // Get current user
  getCurrentUser: async () => {
    const supabaseClient = getSupabase();
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
  },

  // Get current session
  getCurrentSession: async () => {
    const supabaseClient = getSupabase();
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
  },

  // Reset password
  resetPassword: async (email: string) => {
    const supabaseClient = getSupabase();
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  // Update user profile
  updateProfile: async (updates: { username?: string; [key: string]: any }) => {
    const supabaseClient = getSupabase();
    const { error } = await supabaseClient.auth.updateUser({
      data: updates
    });
    if (error) throw error;
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    const session = await authService.getCurrentSession();
    return !!session;
  },

  // Clear app data on logout
  clearAppData: async () => {
    try {
      // Clear any cached data that should be removed on logout
      const keysToRemove = [
        'spotify_cache',
        'user_preferences', 
        'recent_searches',
        'playlist_cache'
      ];
      
      // Use AsyncStorage for React Native
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.multiRemove(keysToRemove);
      
      console.log('App data cleared successfully');
    } catch (error) {  
      console.error('Failed to clear app data:', error);
    }
  },
};

// Email validation helper
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation helper
export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one numerical character' };
  }
  
  return { isValid: true };
};

// Username validation helper
export const validateUsername = (username: string): { isValid: boolean; message?: string } => {
  if (username.length < 3 || username.length > 16) {
    return { isValid: false, message: 'Username must be between 3 and 16 characters long' };
  }
  
  return { isValid: true };
};
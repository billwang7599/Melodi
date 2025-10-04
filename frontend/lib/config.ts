import { SUPABASE } from '@/constants/theme';

export const validateSupabaseConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!SUPABASE.URL || SUPABASE.URL === 'YOUR_SUPABASE_URL') {
    errors.push('EXPO_PUBLIC_SUPABASE_URL is not set in your .env file');
  }

  if (!SUPABASE.ANON_KEY || SUPABASE.ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
    errors.push('EXPO_PUBLIC_SUPABASE_ANON_KEY is not set in your .env file');
  }

  // Basic URL validation
  if (SUPABASE.URL && SUPABASE.URL !== 'YOUR_SUPABASE_URL') {
    try {
      new URL(SUPABASE.URL);
    } catch (error) {
      errors.push('EXPO_PUBLIC_SUPABASE_URL is not a valid URL');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const logSupabaseConfig = () => {
  const validation = validateSupabaseConfig();
  
  if (validation.isValid) {
    console.log('✅ Supabase configuration is valid');
  } else {
    console.error('❌ Supabase configuration errors:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    console.error('Please check your .env file and make sure you have set the correct values.');
  }
  
  return validation.isValid;
};
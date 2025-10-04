import * as Linking from 'expo-linking';

export const debugOAuthSetup = () => {
  const isDevelopment = __DEV__ && Linking.createURL('').includes('localhost');
  const linkingURL = Linking.createURL('auth-callback');
  const deepLinkURL = 'melodi://auth-callback';
  
  const debugInfo = {
    environment: isDevelopment ? 'development' : 'production',
    isDevelopment,
    __DEV__,
    linkingURL,
    deepLinkURL,
    selectedURL: isDevelopment ? linkingURL : deepLinkURL,
    baseURL: Linking.createURL(''),
    recommendations: [] as string[]
  };

  // Add recommendations based on environment
  if (isDevelopment) {
    debugInfo.recommendations.push(
      `Add this to Spotify Redirect URIs: ${linkingURL}`,
      'Also add: http://localhost:19000/auth-callback',
      'Also add: http://localhost:19006/auth-callback'
    );
  } else {
    debugInfo.recommendations.push(
      `Add this to Spotify Redirect URIs: ${deepLinkURL}`,
      'Make sure app.json has scheme: "melodi"'
    );
  }

  // Always recommend Supabase callback
  debugInfo.recommendations.push(
    'Add Supabase callback: https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback'
  );

  return debugInfo;
};

// Helper to log debug info
export const logOAuthDebugInfo = () => {
  const info = debugOAuthSetup();
  console.log('=== OAuth Debug Information ===');
  Object.entries(info).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      console.log(`${key}:`);
      value.forEach(item => console.log(`  - ${item}`));
    } else {
      console.log(`${key}: ${value}`);
    }
  });
  console.log('================================');
  return info;
};
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { spotifyAPI } from '@/lib/spotify';

export default function SpotifyConnectScreen() {
  const [authenticating, setAuthenticating] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { user } = useAuth();
  const primaryColor = useThemeColor({}, 'primary');
  const mutedColor = useThemeColor({}, 'textMuted');

  useEffect(() => {
    // Check if already authenticated with Spotify
    const checkAuth = async () => {
      console.log('[Spotify Connect] Checking if already authenticated...');
      const isAuth = await spotifyAPI.isAuthenticated();
      console.log('[Spotify Connect] Is authenticated:', isAuth);
      if (isAuth) {
        // Already connected, go to feed
        console.log('[Spotify Connect] Already authenticated, redirecting to feed');
        router.replace('/(tabs)/feed');
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, []);

  const handleConnectSpotify = async () => {
    console.log('========================================');
    console.log('[Spotify Connect] Connect button pressed');
    console.log('========================================');
    setAuthenticating(true);
    try {
      console.log('[Spotify Connect] Calling spotifyAPI.authenticate()...');
      const success = await spotifyAPI.authenticate();
      console.log('[Spotify Connect] Authentication returned:', success);
      
      if (success) {
        console.log('[Spotify Connect] Authentication successful!');
        Alert.alert('Success!', 'Connected to Spotify!', [
          {
            text: 'Continue',
            onPress: () => {
              console.log('[Spotify Connect] Navigating to feed...');
              router.replace('/(tabs)/feed');
            },
          },
        ]);
      } else {
        console.log('[Spotify Connect] Authentication failed');
        Alert.alert('Error', 'Failed to connect to Spotify. Please try again.');
        setAuthenticating(false);
      }
    } catch (error) {
      console.error('========================================');
      console.error('[Spotify Connect] Exception during authentication:', error);
      console.error('========================================');
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setAuthenticating(false);
    }
  };

  const handleSkip = () => {
    console.log('[Spotify Connect] User skipped Spotify connection');
    router.replace('/(tabs)/feed');
  };

  if (checkingAuth) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={primaryColor} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <IconSymbol name="music.note" size={80} color={primaryColor} style={styles.icon} />
        
        <ThemedText style={styles.title}>Connect to Spotify</ThemedText>
        
        <ThemedText style={[styles.subtitle, { color: mutedColor }]}>
          Connect your Spotify account to unlock the full Melodi experience
        </ThemedText>

        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <IconSymbol name="checkmark.circle.fill" size={24} color={primaryColor} />
            <ThemedText style={styles.featureText}>Share your favorite songs</ThemedText>
          </View>
          
          <View style={styles.featureItem}>
            <IconSymbol name="checkmark.circle.fill" size={24} color={primaryColor} />
            <ThemedText style={styles.featureText}>Discover music from friends</ThemedText>
          </View>
          
          <View style={styles.featureItem}>
            <IconSymbol name="checkmark.circle.fill" size={24} color={primaryColor} />
            <ThemedText style={styles.featureText}>See your listening analytics</ThemedText>
          </View>
          
          <View style={styles.featureItem}>
            <IconSymbol name="checkmark.circle.fill" size={24} color={primaryColor} />
            <ThemedText style={styles.featureText}>Rank albums and tracks</ThemedText>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.connectButton,
            { backgroundColor: primaryColor, opacity: authenticating ? 0.6 : 1 },
          ]}
          onPress={handleConnectSpotify}
          disabled={authenticating}
        >
          {authenticating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <IconSymbol name="music.note" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              <ThemedText style={styles.connectButtonText}>Connect Spotify</ThemedText>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={authenticating}
        >
          <ThemedText style={[styles.skipButtonText, { color: mutedColor }]}>
            Skip for now
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  icon: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  featuresList: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 48,
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
  },
  connectButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
    minHeight: 56,
    elevation: 3,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonIcon: {
    marginRight: 8,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  skipButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

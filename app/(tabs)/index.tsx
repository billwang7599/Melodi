import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from 'expo-auth-session';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = '0f5c814e10af4468988d67d8fc1c99c7'
const CLIENT_SECRET = 'INSET_CLIENT_SECRET_HEREEE'

export default function HomeScreen() {
  
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: [
        "user-read-email",
        "user-library-read",
        "user-read-recently-played",
        "user-top-read",
        "playlist-read-private",
        "playlist-read-collaborative",
        "playlist-modify-public"
      ],
      redirectUri: 'exp://localhost:19002/--/spotify-auth-callback',
      responseType: AuthSession.ResponseType.Code,
      codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
    },
    {
      authorizationEndpoint: 'https://accounts.spotify.com/authorize',
      tokenEndpoint: 'https://accounts.spotify.com/api/token',
    }
  );
  
  useEffect(() => {
    const checkTokenValidity = async () => {
      const accessToken = await AsyncStorage.getItem("token");
      const expirationDate = await AsyncStorage.getItem("expirationDate");

      if(accessToken && expirationDate){
        const currentTime = Date.now();
        if(currentTime >= parseInt(expirationDate)){
          AsyncStorage.removeItem("token");
          AsyncStorage.removeItem("expirationDate");
        } else {
          router.replace('/dashboard');
        }
      }
    }

    checkTokenValidity();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      exchangeCodeForToken(code);
    } else if (response?.type === 'error') {
      Alert.alert('Error', 'Failed to authenticate with Spotify');
    }
  }, [response]);

  const exchangeCodeForToken = async (code: string) => {
    try {
      const body = `grant_type=authorization_code&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent('exp://localhost:19002/--/spotify-auth-callback')}&code_verifier=${encodeURIComponent(request?.codeVerifier || '')}`;
      
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
        },
        body: body,
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.access_token) {
        const expirationDate = new Date(Date.now() + tokenData.expires_in * 1000).getTime();
        await AsyncStorage.setItem("token", tokenData.access_token);
        await AsyncStorage.setItem("expirationDate", expirationDate.toString());
        
        Alert.alert('Success!', 'Successfully authenticated with Spotify!', [
          {
            text: 'OK',
            onPress: () => router.replace('/dashboard')
          }
        ]);
      } else {
        Alert.alert('Error', 'Failed to get access token from Spotify');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to exchange code for token');
      console.error('Token exchange error:', error);
    }
  };

  const authenticate = () => {
    if (request) {
      promptAsync();
    } else {
      Alert.alert('Error', 'Spotify authentication not configured properly');
    }
  };


  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <TouchableOpacity style={styles.spotifyButton} onPress={authenticate}>
        <Text>Login to Spotify</Text>
      </TouchableOpacity>
      
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  spotifyButton: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    marginTop: 20,
    marginHorizontal: 20,
  },

});

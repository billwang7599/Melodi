import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect } from "react";
import { Alert, StyleSheet, TouchableOpacity } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = "0f5c814e10af4468988d67d8fc1c99c7";
const CLIENT_SECRET = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET ?? "";

if (!CLIENT_SECRET) {
  console.warn("Missing EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET environment variable");
}

const REDIRECT_URI = "melodi://spotify-auth-callback";

export default function HomeScreen() {
  const primaryColor = useThemeColor({}, "primary");
  const secondaryColor = useThemeColor({}, "secondary");
  const shadowColor = useThemeColor({}, "shadow");

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
        "playlist-modify-public",
      ],
      redirectUri: REDIRECT_URI,
      responseType: AuthSession.ResponseType.Code,
      codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
    },
    {
      authorizationEndpoint: "https://accounts.spotify.com/authorize",
      tokenEndpoint: "https://accounts.spotify.com/api/token",
    }
  );

  const exchangeCodeForToken = useCallback(
    async (code: string) => {
      try {
        const body = `grant_type=authorization_code&code=${encodeURIComponent(
          code
        )}&redirect_uri=${encodeURIComponent(
          REDIRECT_URI
        )}&code_verifier=${encodeURIComponent(request?.codeVerifier || "")}`;

        const tokenResponse = await fetch(
          "https://accounts.spotify.com/api/token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: "Basic " + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
            },
            body: body,
          }
        );

        const tokenData = await tokenResponse.json();

        if (tokenData.access_token) {
          const expirationDate = new Date(
            Date.now() + tokenData.expires_in * 1000
          ).getTime();
          await AsyncStorage.setItem("token", tokenData.access_token);
          await AsyncStorage.setItem(
            "expirationDate",
            expirationDate.toString()
          );

          Alert.alert("Success!", "Successfully authenticated with Spotify!", [
            {
              text: "OK",
              onPress: () => router.replace("/dashboard"),
            },
          ]);
        } else {
          Alert.alert("Error", "Failed to get access token from Spotify");
        }
      } catch (error) {
        Alert.alert("Error", "Failed to exchange code for token");
        console.error("Token exchange error:", error);
      }
    },
    [request]
  );

  useEffect(() => {
    const checkTokenValidity = async () => {
      const accessToken = await AsyncStorage.getItem("token");
      const expirationDate = await AsyncStorage.getItem("expirationDate");

      if (accessToken && expirationDate) {
        const currentTime = Date.now();
        if (currentTime >= parseInt(expirationDate)) {
          AsyncStorage.removeItem("token");
          AsyncStorage.removeItem("expirationDate");
        } else {
          router.replace("/dashboard");
        }
      }
    };

    checkTokenValidity();
  }, []);

  useEffect(() => {
    if (response?.type === "success") {
      const { code } = response.params;
      exchangeCodeForToken(code);
    } else if (response?.type === "error") {
      Alert.alert("Error", "Failed to authenticate with Spotify");
    }
  }, [response, exchangeCodeForToken]);

  const authenticate = () => {
    if (request) {
      promptAsync();
    } else {
      Alert.alert("Error", "Spotify authentication not configured properly");
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{
        light: Colors.light.primaryMuted,
        dark: Colors.dark.primaryMuted,
      }}
      headerImage={
        <Image
          source={require("@/assets/images/banner.png")}
          style={styles.backgroundImage}
        />
      }
    >
      <TouchableOpacity
        style={[
          styles.callToAction,
          { backgroundColor: primaryColor, shadowColor },
        ]}
        onPress={authenticate}
      >
        <ThemedText
          style={styles.buttonLabel}
          lightColor="#FFFFFF"
          darkColor="#0F0B20"
        >
          Login to Spotify
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.callToAction,
          styles.secondaryButton,
          { backgroundColor: secondaryColor, shadowColor },
        ]}
        onPress={() => router.push("/(auth)/signup")}
      >
        <ThemedText
          style={styles.buttonLabel}
          lightColor="#0F0B20"
          darkColor="#0F0B20"
        >
          Sign Up
        </ThemedText>
      </TouchableOpacity>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  backgroundImage: {
    height: "100%",
    width: "100%",
    position: "absolute",
    resizeMode: "cover",
  },
  callToAction: {
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    marginHorizontal: 24,
    marginTop: 28,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
  secondaryButton: {
    marginTop: 16,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});

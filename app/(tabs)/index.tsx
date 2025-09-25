import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = "0f5c814e10af4468988d67d8fc1c99c7";
const CLIENT_SECRET = "INSET_CLIENT_SECRET_HEREEE";

const REDIRECT_URI = "melodi://spotify-auth-callback";

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
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/banner.png")}
          style={styles.backgroundImage}
        />
      }
    >
      <TouchableOpacity style={styles.spotifyButton} onPress={authenticate}>
        <Text style={styles.buttonText}>Login to Spotify</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.signupButton}
        onPress={() => router.push("/(auth)/signup")}
      >
        <Text style={styles.buttonText}>Sign Up</Text>
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
  spotifyButton: {
    backgroundColor: "#1DB954",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    marginTop: 20,
    marginHorizontal: 20,
  },
  signupButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    marginTop: 10,
    marginHorizontal: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

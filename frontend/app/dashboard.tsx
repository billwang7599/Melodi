import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";


type SpotifyImage = { url: string; width?: number; height?: number };
type SpotifyArtist = { name: string };
type SpotifyAlbum = { images?: SpotifyImage[] };
type SpotifyTrack = { name?: string; artists?: SpotifyArtist[]; album?: SpotifyAlbum };
type RecentlyPlayedItem = { played_at: string; track: SpotifyTrack };
type RecentlyPlayedResponse = { items?: RecentlyPlayedItem[] };
type SearchTracksResponse = {
  tracks?: {
    items?: (SpotifyTrack & {
      id: string;
      uri?: string;
    })[];
  };
};


type UserProfile = {
  id: string;
  display_name?: string;
};

const formatArtists = (artists: SpotifyArtist[] = []) =>
  artists.map((a) => a.name).join(", ");

const formatPlayedAt = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString();
};

async function getAccessTokenOrKick(): Promise<string | null> {
  const accessToken = await AsyncStorage.getItem("token");
  if (!accessToken) {
    Alert.alert("Error", "No access token found. Please login again.");
    router.replace("/(tabs)");
    return null;
  }
  return accessToken;
}

export default function DashboardScreen() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedResponse | null>(null);
  const [screenLoading, setScreenLoading] = useState(true);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);


  const authHeaders = useMemo(
    () => async () => {
      const token = await getAccessTokenOrKick();
      return token ? { Authorization: `Bearer ${token}` } : null;
    },
    []
  );


  const fetchUserProfile = useCallback(async () => {
    setScreenLoading(true);
    try {
      const headers = await authHeaders();
      if (!headers) return;

      const res = await fetch("https://api.spotify.com/v1/me", { headers });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`Failed to fetch profile. ${msg}`);
      }
      const profile: UserProfile = await res.json();
      setUserProfile(profile);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to fetch user profile");
    } finally {
      setScreenLoading(false);
    }
  }, [authHeaders]);

  const fetchRecentlyPlayedTracks = useCallback(async () => {
    setTracksLoading(true);
    try {
      const headers = await authHeaders();
      if (!headers) return;

      const res = await fetch(
        "https://api.spotify.com/v1/me/player/recently-played?limit=20",
        { headers }
      );
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`Failed to fetch recently played. ${msg}`);
      }
      const data: RecentlyPlayedResponse = await res.json();
      setRecentlyPlayed(data);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to fetch recently played tracks");
    } finally {
      setTracksLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const searchTracks = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const headers = await authHeaders();
      if (!headers) return;
  
      const url = `https://api.spotify.com/v1/search?type=track&limit=20&q=${encodeURIComponent(trimmed)}`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`Search failed. ${msg}`);
      }
      const data: SearchTracksResponse = await res.json();
      setSearchResults(data.tracks?.items ?? []);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to search tracks");
    } finally {
      setSearching(false);
    }
  }, [authHeaders]);
  


  const logout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(["token", "expirationDate"]);
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }, []);


  if (screenLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  const items = recentlyPlayed?.items ?? [];

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Melodi</Text>
          {!!userProfile && (
            <Text style={styles.userNameText}>
              Hello, {userProfile.display_name || userProfile.id}!
            </Text>
          )}
        </View>

        <View style={styles.featuresSection}>
          <TouchableOpacity
            style={styles.featureButton}
            onPress={() => router.push("/recently-played")}
          >
            <Text style={styles.featureButtonText}>Get Recently Played Tracks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureButton}
            onPress={() => router.push("/search-tracks")}
          >
            <Text style={styles.featureButtonText}>Search for a Track</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1DB954",
  },
  loadingText: { fontSize: 18, color: "white", fontWeight: "600" },
  container: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%",
  },
  welcomeSection: { alignItems: "center", marginBottom: 40 },
  welcomeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1DB954",
    marginBottom: 8,
    textAlign: "center",
  },
  userNameText: { fontSize: 18, color: "#666", fontWeight: "500", textAlign: "center" },
  featuresSection: { width: "100%", maxWidth: 400, marginBottom: 40 },
  sectionTitle: { fontSize: 22, fontWeight: "600", color: "#333", marginBottom: 24, textAlign: "center" },
  featureButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureButtonText: { fontSize: 16, color: "#333", fontWeight: "500", textAlign: "center" },
  logoutButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e9ecef",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111",
    paddingVertical: 6,
  },
  clearText: {
    marginLeft: 8,
    color: "#1DB954",
    fontWeight: "600",
  },  
  artwork: { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
  trackMeta: { flex: 1, minWidth: 0 },
  trackName: { fontSize: 16, fontWeight: "600", color: "#111", marginBottom: 2 },
  trackArtists: { fontSize: 14, color: "#555", marginBottom: 2 },
  playedAt: { fontSize: 12, color: "#888" },
});

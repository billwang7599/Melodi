import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, View } from "react-native";

type SpotifyImage = { url: string; width?: number; height?: number };
type SpotifyArtist = { name: string };
type SpotifyAlbum = { images?: SpotifyImage[] };
type SpotifyTrack = { name?: string; artists?: SpotifyArtist[]; album?: SpotifyAlbum };
type RecentlyPlayedItem = { played_at: string; track: SpotifyTrack };
type RecentlyPlayedResponse = { items?: RecentlyPlayedItem[] };

const formatArtists = (artists: SpotifyArtist[] = []) => artists.map(a => a.name).join(", ");
const formatPlayedAt = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString();
};

async function getAccessTokenOrKick(): Promise<string | null> {
  const accessToken = await AsyncStorage.getItem("token");
  if (!accessToken) {
    Alert.alert("Error", "No access token found. Please login again.");
    return null;
  }
  return accessToken;
}

export default function RecentlyPlayedScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RecentlyPlayedResponse | null>(null);

  const authHeaders = useMemo(
    () => async () => {
      const token = await getAccessTokenOrKick();
      return token ? { Authorization: `Bearer ${token}` } : null;
    },
    []
  );

  const fetchRecentlyPlayedTracks = useCallback(async () => {
    setLoading(true);
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
      const json: RecentlyPlayedResponse = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to fetch recently played tracks");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchRecentlyPlayedTracks();
  }, [fetchRecentlyPlayedTracks]);

  const items = data?.items ?? [];

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading…</Text>
      </View>
    );
  }

  if (!items.length) {
    return (
      <View style={s.empty}>
        <Text style={{ color: "#666" }}>No recently played tracks found.</Text>
      </View>
    );
  }

  return (
    <View style={s.page}>
      <FlatList
        data={items}
        keyExtractor={(it) => it.played_at}
        renderItem={({ item }) => {
          const track = item.track;
          const imgs = track?.album?.images ?? [];
          const image = (imgs as SpotifyImage[]).at(-1) ?? imgs[0];

          return (
            <View style={s.row}>
              {image?.url ? (
                <Image source={{ uri: image.url }} style={s.art} resizeMode="cover" />
              ) : (
                <View style={[s.art, { backgroundColor: "#eee" }]} />
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.title} numberOfLines={1}>{track?.name ?? "Unknown Title"}</Text>
                <Text style={s.artist} numberOfLines={1}>{formatArtists(track?.artists)}</Text>
                <Text style={s.meta}>Played at {formatPlayedAt(item.played_at)}</Text>
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fff" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  row: {
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
  art: { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
  title: { fontSize: 16, fontWeight: "600", color: "#111", marginBottom: 2 },
  artist: { fontSize: 14, color: "#555", marginBottom: 2 },
  meta: { fontSize: 12, color: "#888" },
});

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type SpotifyImage = { url: string; width?: number; height?: number };
type SpotifyArtist = { name: string };
type SpotifyAlbum = { images?: SpotifyImage[] };
type SpotifyTrack = { id?: string; name?: string; artists?: SpotifyArtist[]; album?: SpotifyAlbum; uri?: string; };
type SearchTracksResponse = { tracks?: { items?: SpotifyTrack[] } };

const formatArtists = (artists: SpotifyArtist[] = []) => artists.map(a => a.name).join(", ");

async function getAccessTokenOrKick(): Promise<string | null> {
  const accessToken = await AsyncStorage.getItem("token");
  if (!accessToken) {
    Alert.alert("Error", "No access token found. Please login again.");
    return null;
  }
  return accessToken;
}

export default function SearchTracksScreen() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SpotifyTrack[]>([]);

  const authHeaders = useMemo(
    () => async () => {
      const token = await getAccessTokenOrKick();
      return token ? { Authorization: `Bearer ${token}` } : null;
    },
    []
  );

  const searchTracks = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) { setResults([]); return; }
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
      setResults(data.tracks?.items ?? []);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to search tracks");
    } finally {
      setSearching(false);
    }
  }, [authHeaders]);

  // Debounce typing
  useEffect(() => {
    const id = setTimeout(() => { if (query.length) searchTracks(query); }, 300);
    return () => clearTimeout(id);
  }, [query, searchTracks]);

  return (
    <View style={s.page}>
      <View style={s.searchBar}>
        <Text style={s.searchIcon}>🔎</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Type a song, artist, or album…"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => searchTracks(query)}
        />
        {!!query && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Text style={s.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {searching && (
        <View style={{ paddingVertical: 12, alignItems: "center" }}>
          <ActivityIndicator />
        </View>
      )}

      {!searching && query.trim().length > 0 && !results.length && (
        <Text style={{ color: "#666", textAlign: "center", marginTop: 12 }}>No results.</Text>
      )}

      <FlatList
        data={results}
        keyExtractor={(t, i) => t.id ?? `${i}`}
        renderItem={({ item }) => {
          const imgs = item?.album?.images ?? [];
          const image = (imgs as SpotifyImage[]).at(-1) ?? imgs[0];
          return (
            <View style={s.row}>
              {image?.url ? (
                <Image source={{ uri: image.url }} style={s.art} resizeMode="cover" />
              ) : (
                <View style={[s.art, { backgroundColor: "#eee" }]} />
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.title} numberOfLines={1}>{item?.name ?? "Unknown Title"}</Text>
                <Text style={s.artist} numberOfLines={1}>{formatArtists(item?.artists)}</Text>
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fff" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1, borderColor: "#e9ecef",
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: "#fff", margin: 16, marginBottom: 8,
  },
  searchIcon: { marginRight: 8, fontSize: 16 },
  searchInput: { flex: 1, fontSize: 16, color: "#111", paddingVertical: 6 },
  clearText: { marginLeft: 8, color: "#1DB954", fontWeight: "600" },
  row: {
    flexDirection: "row", alignItems: "center",
    padding: 12, borderRadius: 14,
    borderWidth: 1, borderColor: "#e9ecef",
    backgroundColor: "#fff",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 2, elevation: 2,
  },
  art: { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
  title: { fontSize: 16, fontWeight: "600", color: "#111", marginBottom: 2 },
  artist: { fontSize: 14, color: "#555", marginBottom: 2 },
});

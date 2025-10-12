import { Image } from 'expo-image';
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface Song {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
}

interface TopSongsSectionProps {
  songs: Song[];
  onSongPress?: (song: Song) => void;
  onSeeAllPress?: () => void;
}

export function TopSongsSection({ songs, onSongPress, onSeeAllPress }: TopSongsSectionProps) {
  const primaryColor = useThemeColor({}, 'primary');
  const mutedColor = useThemeColor({}, 'textMuted');

  if (songs.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Top Tracks</ThemedText>
        {onSeeAllPress && (
          <TouchableOpacity onPress={onSeeAllPress}>
            <ThemedText style={[styles.seeAllText, { color: primaryColor }]}>
              See All
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {songs.map((song) => (
          <TouchableOpacity 
            key={song.id} 
            style={[styles.songCard, { width: CARD_WIDTH }]}
            onPress={() => onSongPress?.(song)}
          >
            <Image
              source={{ uri: song.albumArt }}
              style={styles.songImage}
            />
            <ThemedText style={styles.songName} numberOfLines={2}>
              {song.name}
            </ThemedText>
            <ThemedText style={[styles.songArtist, { color: mutedColor }]} numberOfLines={1}>
              {song.artist}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  songCard: {
    marginRight: 12,
  },
  songImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  songName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  songArtist: {
    fontSize: 12,
  },
});


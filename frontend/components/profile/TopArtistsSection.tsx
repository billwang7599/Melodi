import { Image } from 'expo-image';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

const { width } = Dimensions.get('window');

interface Artist {
  id: string;
  name: string;
  image: string;
  genres: string[];
}

interface TopArtistsSectionProps {
  artists: Artist[];
  onArtistPress?: (artist: Artist) => void;
  onSeeAllPress?: () => void;
}

export function TopArtistsSection({ artists, onArtistPress, onSeeAllPress }: TopArtistsSectionProps) {
  const primaryColor = useThemeColor({}, 'primary');
  const mutedColor = useThemeColor({}, 'textMuted');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');

  if (artists.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Top Artists</ThemedText>
        {onSeeAllPress && (
          <TouchableOpacity onPress={onSeeAllPress}>
            <ThemedText style={[styles.seeAllText, { color: primaryColor }]}>
              See All
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.artistsGrid}>
        {artists.map((artist) => (
          <TouchableOpacity 
            key={artist.id} 
            style={[
              styles.artistCard,
              { backgroundColor: surfaceColor, borderColor }
            ]}
            onPress={() => onArtistPress?.(artist)}
          >
            <Image
              source={{ uri: artist.image }}
              style={styles.artistImage}
            />
            <ThemedText style={styles.artistName} numberOfLines={1}>
              {artist.name}
            </ThemedText>
            <ThemedText style={[styles.artistGenres, { color: mutedColor }]} numberOfLines={1}>
              {artist.genres.slice(0, 2).join(', ')}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  artistsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  artistCard: {
    width: (width - 48) / 3,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  artistImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  artistName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  artistGenres: {
    fontSize: 10,
    textAlign: 'center',
  },
});


import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface ProfileStats {
  totalPosts: number;
  totalFollowers: number;
  totalFollowing: number;
}

interface TopTrack {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  previewUrl?: string;
}

interface TopArtist {
  id: string;
  name: string;
  image: string;
  genres: string[];
}

interface ListeningStats {
  totalMinutes: number;
  topGenre: string;
  danceability: number;
  energy: number;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const primaryColor = useThemeColor({}, 'primary');
  const mutedColor = useThemeColor({}, 'textMuted');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');

  const [loading, setLoading] = useState(true);
  const [timeRangeLoading, setTimeRangeLoading] = useState(false);
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    totalPosts: 0,
    totalFollowers: 0,
    totalFollowing: 0,
  });
  const [topTracks, setTopTracks] = useState<TopTrack[]>([]);
  const [topArtists, setTopArtists] = useState<TopArtist[]>([]);
  const [listeningStats, setListeningStats] = useState<ListeningStats | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'short_term' | 'medium_term' | 'long_term'>('medium_term');

  // function to load music data based on time range
  const loadMusicData = useCallback(async (timeRange: 'short_term' | 'medium_term' | 'long_term') => {
    try {
      // TODO replace w/ API calls for time-range specific data
      
      // simulate delay
      await new Promise(resolve => setTimeout(resolve, 400));
      
      setTopTracks([
        {
          id: '1',
          name: 'Blinding Lights',
          artist: 'The Weeknd',
          albumArt: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
        },
        {
          id: '2',
          name: 'Levitating',
          artist: 'Dua Lipa',
          albumArt: 'https://i.scdn.co/image/ab67616d0000b273be841ba4bc24340152e3a79a',
        },
        {
          id: '3',
          name: 'Save Your Tears',
          artist: 'The Weeknd',
          albumArt: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
        },
        {
          id: '4',
          name: 'Peaches',
          artist: 'Justin Bieber',
          albumArt: 'https://i.scdn.co/image/ab67616d0000b273e6f407c7f3a0ec98845e4431',
        },
      ]);

      setTopArtists([
        {
          id: '1',
          name: 'The Weeknd',
          image: 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb',
          genres: ['pop', 'r&b'],
        },
        {
          id: '2',
          name: 'Dua Lipa',
          image: 'https://i.scdn.co/image/ab6761610000e5eb0c68f6c95232e716f0abee8d',
          genres: ['pop', 'dance'],
        },
        {
          id: '3',
          name: 'Drake',
          image: 'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9',
          genres: ['hip-hop', 'rap'],
        },
      ]);
    } catch (error) {
      console.error('Error loading music data:', error);
    }
  }, []);

  // Load initial profile data (only runs once on mount)
  useEffect(() => {
    const loadInitialProfileData = async () => {
      setLoading(true);
      try {
        // TODO: Replace with real API calls
        // Simulating API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data - This should be fetched once and not change with time range
        setProfileStats({
          totalPosts: 42,
          totalFollowers: 128,
          totalFollowing: 89,
        });

        setListeningStats({
          totalMinutes: 12456,
          topGenre: 'Pop',
          danceability: 72,
          energy: 68,
        });

        // Also load initial music data
        await loadMusicData('medium_term');
      } catch (error) {
        console.error('Error loading initial profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadInitialProfileData();
    }
  }, [user, loadMusicData]);

  // handle time range changes
  const handleTimeRangeChange = async (timeRange: 'short_term' | 'medium_term' | 'long_term') => {
    setSelectedTimeRange(timeRange);
    setTimeRangeLoading(true);
    await loadMusicData(timeRange);
    setTimeRangeLoading(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const timeRangeLabels = {
    short_term: 'Last Month',
    medium_term: 'Last 6 Months',
    long_term: 'All Time',
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={styles.loadingText}>Loading your profile...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Profile</ThemedText>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => router.push('/profile/edit' as any)}
            >
              <IconSymbol name="gear" size={20} color={mutedColor} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleLogout}
            >
              <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={mutedColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Info */}
        <View style={[styles.profileCard, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { borderColor: primaryColor }]}>
              <IconSymbol name="person.fill" size={40} color={primaryColor} />
            </View>
          </View>
          
          <ThemedText style={styles.displayName}>
            {user?.user_metadata?.username || user?.email?.split('@')[0] || 'Music Lover'}
          </ThemedText>
          
          {user?.email && (
            <ThemedText style={[styles.email, { color: mutedColor }]}>
              {user.email}
            </ThemedText>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{profileStats.totalPosts}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Posts</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{profileStats.totalFollowers}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Followers</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{profileStats.totalFollowing}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Following</ThemedText>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity 
            style={[styles.editButton, { borderColor }]}
            onPress={() => router.push('/profile/edit' as any)}
          >
            <IconSymbol name="pencil" size={14} color={primaryColor} />
            <ThemedText style={[styles.editButtonText, { color: primaryColor }]}>
              Edit Profile
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Listening Stats */}
        {listeningStats && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Listening Stats</ThemedText>
            <View style={[styles.card, { backgroundColor: surfaceColor, borderColor }]}>
              <View style={styles.listeningStatsGrid}>
                <View style={styles.listeningStatItem}>
                  <IconSymbol name="clock.fill" size={24} color={primaryColor} />
                  <ThemedText style={styles.listeningStatValue}>
                    {Math.round(listeningStats.totalMinutes / 60)}h
                  </ThemedText>
                  <ThemedText style={[styles.listeningStatLabel, { color: mutedColor }]}>
                    Total Listened
                  </ThemedText>
                </View>
                
                <View style={styles.listeningStatItem}>
                  <IconSymbol name="music.note" size={24} color={primaryColor} />
                  <ThemedText style={styles.listeningStatValue}>
                    {listeningStats.topGenre}
                  </ThemedText>
                  <ThemedText style={[styles.listeningStatLabel, { color: mutedColor }]}>
                    Top Genre
                  </ThemedText>
                </View>

                <View style={styles.listeningStatItem}>
                  <IconSymbol name="figure.dance" size={24} color={primaryColor} />
                  <ThemedText style={styles.listeningStatValue}>
                    {listeningStats.danceability}%
                  </ThemedText>
                  <ThemedText style={[styles.listeningStatLabel, { color: mutedColor }]}>
                    Danceability
                  </ThemedText>
                </View>

                <View style={styles.listeningStatItem}>
                  <IconSymbol name="bolt.fill" size={24} color={primaryColor} />
                  <ThemedText style={styles.listeningStatValue}>
                    {listeningStats.energy}%
                  </ThemedText>
                  <ThemedText style={[styles.listeningStatLabel, { color: mutedColor }]}>
                    Energy
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Time Range Selector */}
        <View style={styles.timeRangeSelector}>
          {(['short_term', 'medium_term', 'long_term'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                selectedTimeRange === range && [styles.timeRangeButtonActive, { backgroundColor: primaryColor }],
                { borderColor },
              ]}
              onPress={() => handleTimeRangeChange(range)}
              disabled={timeRangeLoading}
            >
              <ThemedText
                style={[
                  styles.timeRangeText,
                  selectedTimeRange === range && styles.timeRangeTextActive,
                  selectedTimeRange !== range && { color: mutedColor },
                  timeRangeLoading && styles.timeRangeTextDisabled,
                ]}
              >
                {timeRangeLabels[range]}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Top Tracks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Your Top Tracks</ThemedText>
            <TouchableOpacity>
              <ThemedText style={[styles.seeAllText, { color: primaryColor }]}>See All</ThemedText>
            </TouchableOpacity>
          </View>
          
          {timeRangeLoading ? (
            <View style={styles.musicLoadingContainer}>
              <ActivityIndicator size="small" color={primaryColor} />
              <ThemedText style={[styles.musicLoadingText, { color: mutedColor }]}>
                Loading tracks...
              </ThemedText>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {topTracks.map((track) => (
                <TouchableOpacity 
                  key={track.id} 
                  style={[styles.trackCard, { width: CARD_WIDTH }]}
                >
                  <Image
                    source={{ uri: track.albumArt }}
                    style={styles.trackImage}
                  />
                  <ThemedText style={styles.trackName} numberOfLines={2}>
                    {track.name}
                  </ThemedText>
                  <ThemedText style={[styles.trackArtist, { color: mutedColor }]} numberOfLines={1}>
                    {track.artist}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Top Artists */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Your Top Artists</ThemedText>
            <TouchableOpacity>
              <ThemedText style={[styles.seeAllText, { color: primaryColor }]}>See All</ThemedText>
            </TouchableOpacity>
          </View>
          
          {timeRangeLoading ? (
            <View style={styles.musicLoadingContainer}>
              <ActivityIndicator size="small" color={primaryColor} />
              <ThemedText style={[styles.musicLoadingText, { color: mutedColor }]}>
                Loading artists...
              </ThemedText>
            </View>
          ) : (
            <View style={styles.artistsGrid}>
              {topArtists.map((artist) => (
                <TouchableOpacity 
                  key={artist.id} 
                  style={[styles.artistCard, { backgroundColor: surfaceColor, borderColor }]}
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
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  profileCard: {
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  listeningStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  listeningStatItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
  },
  listeningStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  listeningStatLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    marginTop: 24,
    marginHorizontal: 16,
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    borderWidth: 0,
  },
  timeRangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
  },
  timeRangeTextDisabled: {
    opacity: 0.5,
  },
  musicLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  musicLoadingText: {
    fontSize: 14,
  },
  horizontalScroll: {
    paddingRight: 16,
    gap: 12,
  },
  trackCard: {
    marginRight: 12,
  },
  trackImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  trackName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 12,
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
  bottomPadding: {
    height: 40,
  },
});


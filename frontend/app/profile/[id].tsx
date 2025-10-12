import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  bio?: string;
  favoriteGenres?: string;
  isPublic: boolean;
  stats: {
    totalPosts: number;
    totalFollowers: number;
    totalFollowing: number;
  };
  preferences: {
    showTopTracks: boolean;
    showTopArtists: boolean;
    showListeningStats: boolean;
  };
}

interface TopTrack {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
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

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const primaryColor = useThemeColor({}, 'primary');
  const mutedColor = useThemeColor({}, 'textMuted');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');

  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [topTracks, setTopTracks] = useState<TopTrack[]>([]);
  const [topArtists, setTopArtists] = useState<TopArtist[]>([]);
  const [listeningStats, setListeningStats] = useState<ListeningStats | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      setLoading(true);
      try {
        // TODO: API call to fetch user profile
        console.log('Loading profile for user:', id);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data
        setUserProfile({
          id: id || '',
          username: `user_${id}`,
          displayName: 'Music Enthusiast',
          email: `user${id}@example.com`,
          bio: 'Love discovering new music and sharing my favorites with friends! 🎵',
          favoriteGenres: 'Pop, R&B, Indie',
          isPublic: true,
          stats: {
            totalPosts: 35,
            totalFollowers: 256,
            totalFollowing: 142,
          },
          preferences: {
            showTopTracks: true,
            showTopArtists: true,
            showListeningStats: true,
          },
        });

        setTopTracks([
          {
            id: '1',
            name: 'Anti-Hero',
            artist: 'Taylor Swift',
            albumArt: 'https://i.scdn.co/image/ab67616d0000b273e0b60c608586d88252b8fbc0',
          },
          {
            id: '2',
            name: 'Flowers',
            artist: 'Miley Cyrus',
            albumArt: 'https://i.scdn.co/image/ab67616d0000b273f94b35c1a21a6cff0e9e987e',
          },
          {
            id: '3',
            name: 'As It Was',
            artist: 'Harry Styles',
            albumArt: 'https://i.scdn.co/image/ab67616d0000b2732e8ed79e177ff6011076f5f0',
          },
          {
            id: '4',
            name: 'vampire',
            artist: 'Olivia Rodrigo',
            albumArt: 'https://i.scdn.co/image/ab67616d0000b273e85259a1cae29a8d91f2093d',
          },
        ]);

        setTopArtists([
          {
            id: '1',
            name: 'Taylor Swift',
            image: 'https://i.scdn.co/image/ab6761610000e5ebe672b5f553298dcdccb0e676',
            genres: ['pop', 'country'],
          },
          {
            id: '2',
            name: 'Harry Styles',
            image: 'https://i.scdn.co/image/ab6761610000e5eb77dd5f3f3f8b2267c6b4a81e',
            genres: ['pop', 'rock'],
          },
          {
            id: '3',
            name: 'Olivia Rodrigo',
            image: 'https://i.scdn.co/image/ab6761610000e5ebe03a98785f3658f0b6461ec4',
            genres: ['pop', 'alternative'],
          },
        ]);

        setListeningStats({
          totalMinutes: 8920,
          topGenre: 'Pop',
          danceability: 68,
          energy: 71,
        });

        // Check if already following
        setIsFollowing(false); // TODO: check from API
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadUserProfile();
    }
  }, [id]);

  const handleFollow = async () => {
    try {
      // TODO: Implement follow/unfollow API call
      setIsFollowing(!isFollowing);
      console.log(isFollowing ? 'Unfollowing user' : 'Following user', id);
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
    }
  };

  const isOwnProfile = user?.id === id;

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!userProfile || !userProfile.isPublic) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={mutedColor} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <IconSymbol name="lock.fill" size={64} color={mutedColor} style={styles.emptyIcon} />
          <ThemedText style={styles.emptyTitle}>Profile Not Available</ThemedText>
          <ThemedText style={[styles.emptyText, { color: mutedColor }]}>
            This profile is private or doesn&apos;t exist.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={mutedColor} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Profile</ThemedText>
          <View style={styles.backButton} />
        </View>

        {/* Profile Info */}
        <View style={[styles.profileCard, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { borderColor: primaryColor }]}>
              <IconSymbol name="person.fill" size={40} color={primaryColor} />
            </View>
          </View>
          
          <ThemedText style={styles.displayName}>
            {userProfile.displayName}
          </ThemedText>
          
          <ThemedText style={[styles.username, { color: mutedColor }]}>
            @{userProfile.username}
          </ThemedText>

          {userProfile.bio && (
            <ThemedText style={[styles.bio, { color: mutedColor }]}>
              {userProfile.bio}
            </ThemedText>
          )}

          {userProfile.favoriteGenres && (
            <View style={styles.genresContainer}>
              {userProfile.favoriteGenres.split(',').map((genre, index) => (
                <View key={index} style={[styles.genreTag, { backgroundColor: primaryColor + '20', borderColor: primaryColor }]}>
                  <ThemedText style={[styles.genreText, { color: primaryColor }]}>
                    {genre.trim()}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{userProfile.stats.totalPosts}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Posts</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{userProfile.stats.totalFollowers}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Followers</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{userProfile.stats.totalFollowing}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Following</ThemedText>
            </View>
          </View>

          {/* Follow Button */}
          {!isOwnProfile && (
            <TouchableOpacity 
              style={[
                styles.followButton,
                isFollowing ? { borderColor, backgroundColor: 'transparent' } : { backgroundColor: primaryColor }
              ]}
              onPress={handleFollow}
            >
              <ThemedText 
                style={[
                  styles.followButtonText,
                  isFollowing ? { color: primaryColor } : { color: '#FFFFFF' }
                ]}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Listening Stats */}
        {userProfile.preferences.showListeningStats && listeningStats && (
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

        {/* Top Tracks */}
        {userProfile.preferences.showTopTracks && topTracks.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Top Tracks</ThemedText>
            
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
          </View>
        )}

        {/* Top Artists */}
        {userProfile.preferences.showTopArtists && topArtists.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Top Artists</ThemedText>
            
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
          </View>
        )}

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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  username: {
    fontSize: 14,
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  genreTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  genreText: {
    fontSize: 12,
    fontWeight: '600',
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
  followButton: {
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 120,
    alignItems: 'center',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
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


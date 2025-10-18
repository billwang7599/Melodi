import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  email: string;
  bio?: string;
  favorite_genres?: string;
  is_public: boolean;
  stats: {
    totalPosts: number;
    totalFollowers: number;
    totalFollowing: number;
  };
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
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      setLoading(true);
      try {
        console.log('Loading profile for user:', id);
        
        // Fetch user profile from backend
        const response = await fetch(`${API.BACKEND_URL}/api/auth/user/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('User profile loaded:', result);
        
        setUserProfile(result.user);

        // TODO: Check if already following from API
        setIsFollowing(false);
      } catch (error) {
        console.error('Error loading user profile:', error);
        setUserProfile(null);
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

  if (!userProfile) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={mutedColor} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <IconSymbol name="person.circle.fill" size={64} color={mutedColor} style={styles.emptyIcon} />
          <ThemedText style={styles.emptyTitle}>Profile Not Found</ThemedText>
          <ThemedText style={[styles.emptyText, { color: mutedColor }]}>
            This profile doesn&apos;t exist or couldn&apos;t be loaded.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!userProfile.is_public && user?.id !== id) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={mutedColor} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <IconSymbol name="lock.fill" size={64} color={mutedColor} style={styles.emptyIcon} />
          <ThemedText style={styles.emptyTitle}>Private Profile</ThemedText>
          <ThemedText style={[styles.emptyText, { color: mutedColor }]}>
            This profile is private.
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
          {isOwnProfile && (
            <TouchableOpacity 
              onPress={() => router.push('/profile/edit')} 
              style={styles.backButton}
            >
              <IconSymbol name="pencil" size={20} color={primaryColor} />
            </TouchableOpacity>
          )}
          {!isOwnProfile && <View style={styles.backButton} />}
        </View>

        {/* Profile Info */}
        <View style={[styles.profileCard, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { borderColor: primaryColor }]}>
              <IconSymbol name="person.circle.fill" size={40} color={primaryColor} />
            </View>
          </View>
          
          <ThemedText style={styles.displayName}>
            {userProfile.display_name || userProfile.username}
          </ThemedText>
          
          <ThemedText style={[styles.username, { color: mutedColor }]}>
            @{userProfile.username}
          </ThemedText>

          {userProfile.bio && (
            <ThemedText style={[styles.bio, { color: mutedColor }]}>
              {userProfile.bio}
            </ThemedText>
          )}

          {userProfile.favorite_genres && (
            <View style={styles.genresContainer}>
              {userProfile.favorite_genres.split(',').map((genre, index) => (
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
  bottomPadding: {
    height: 40,
  },
});

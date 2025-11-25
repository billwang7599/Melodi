import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';

interface User {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  is_public: boolean;
  isOwnProfile: boolean;
  isFollowing: boolean;
}

export default function FollowingScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user, token } = useAuth();
  const primaryColor = useThemeColor({}, 'primary');
  const mutedColor = useThemeColor({}, 'textMuted');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const insets = useSafeAreaInsets();

  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadFollowing = async () => {
      setLoading(true);
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(
          `${API.BACKEND_URL}/api/users/${userId}/following`,
          {
            method: 'GET',
            headers,
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setFollowing(result.following || []);

        // Initialize following states
        const states: Record<string, boolean> = {};
        result.following?.forEach((u: User) => {
          states[u.id] = u.isFollowing || false;
        });
        setFollowingStates(states);
      } catch (error) {
        console.error('Error loading following:', error);
        setFollowing([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadFollowing();
    }
  }, [userId, token]);

  const handleUnfollow = async (targetUserId: string) => {
    if (!token) {
      return;
    }

    const currentFollowingState = followingStates[targetUserId] ?? true;

    // Optimistic update
    setFollowingStates({
      ...followingStates,
      [targetUserId]: false,
    });

    // Remove from list optimistically
    const updatedFollowing = following.filter(u => u.id !== targetUserId);
    setFollowing(updatedFollowing);

    try {
      const response = await fetch(
        `${API.BACKEND_URL}/api/users/${targetUserId}/follow`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      // Revert optimistic update
      setFollowingStates({
        ...followingStates,
        [targetUserId]: currentFollowingState,
      });
      setFollowing(following);
    }
  };

  const handleUserPress = (targetUserId: string) => {
    router.push(`/profile/${targetUserId}` as any);
  };

  const renderFollowingItem = ({ item }: { item: User }) => {
    const isFollowing = followingStates[item.id] ?? true;
    const isOwnProfile = item.isOwnProfile || item.id === user?.id;
    const isOwnFollowingList = userId === user?.id;

    return (
      <TouchableOpacity
        style={[styles.userItem, { backgroundColor: surfaceColor, borderColor }]}
        onPress={() => handleUserPress(item.id)}
      >
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { borderColor: primaryColor }]}>
            <IconSymbol name="person.fill" size={24} color={primaryColor} />
          </View>
          <View style={styles.userDetails}>
            <ThemedText style={styles.displayName}>
              {item.display_name || item.username}
            </ThemedText>
            <ThemedText style={[styles.username, { color: mutedColor }]}>
              @{item.username}
            </ThemedText>
            {item.bio && (
              <ThemedText style={[styles.bio, { color: mutedColor }]} numberOfLines={1}>
                {item.bio}
              </ThemedText>
            )}
          </View>
        </View>
        {!isOwnProfile && token && (
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing && isOwnFollowingList
                ? { borderColor, backgroundColor: 'transparent' }
                : { backgroundColor: primaryColor },
            ]}
            onPress={(e) => {
              e.stopPropagation();
              if (isOwnFollowingList && isFollowing) {
                handleUnfollow(item.id);
              } else if (!isFollowing) {
                // Handle follow (shouldn't happen in following list, but just in case)
                // This would need a follow handler similar to followers page
              }
            }}
          >
            <ThemedText
              style={[
                styles.followButtonText,
                isFollowing && isOwnFollowingList ? { color: primaryColor } : { color: '#FFFFFF' },
              ]}
            >
              {isOwnFollowingList && isFollowing ? 'Unfollow' : isFollowing ? 'Following' : 'Follow'}
            </ThemedText>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={mutedColor} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Following</ThemedText>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={[styles.loadingText, { color: mutedColor }]}>
            Loading following...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={mutedColor} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Following</ThemedText>
        <View style={styles.backButton} />
      </View>

      {following.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="person.2.fill" size={64} color={mutedColor} style={styles.emptyIcon} />
          <ThemedText style={styles.emptyTitle}>Not following anyone yet</ThemedText>
          <ThemedText style={[styles.emptyText, { color: mutedColor }]}>
            When this user follows someone, they&apos;ll appear here
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={following}
          renderItem={renderFollowingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    marginBottom: 4,
  },
  bio: {
    fontSize: 12,
  },
  followButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});


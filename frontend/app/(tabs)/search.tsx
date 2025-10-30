import { router } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TextInput,
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

export default function SearchUsersScreen() {
  const { user, token } = useAuth();
  const primaryColor = useThemeColor({}, 'primary');
  const mutedColor = useThemeColor({}, 'textMuted');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const inputBackgroundColor = useThemeColor({}, 'inputBackground');
  const inputBorderColor = useThemeColor({}, 'inputBorder');
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API.BACKEND_URL}/api/users/search?query=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setUsers(result.users || []);

      // Initialize following states
      const states: Record<string, boolean> = {};
      result.users?.forEach((u: User) => {
        states[u.id] = u.isFollowing || false;
      });
      setFollowingStates(states);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  const handleFollow = async (targetUserId: string) => {
    if (!token) {
      return;
    }

    const currentFollowingState = followingStates[targetUserId] || false;
    const newFollowingState = !currentFollowingState;

    // Optimistic update
    setFollowingStates({
      ...followingStates,
      [targetUserId]: newFollowingState,
    });

    try {
      const endpoint = 'follow';
      const method = newFollowingState ? 'POST' : 'DELETE';

      const response = await fetch(
        `${API.BACKEND_URL}/api/users/${targetUserId}/${endpoint}`,
        {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update users list to reflect new follow status
      setUsers(users.map(u => 
        u.id === targetUserId 
          ? { ...u, isFollowing: newFollowingState }
          : u
      ));
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      // Revert optimistic update
      setFollowingStates({
        ...followingStates,
        [targetUserId]: currentFollowingState,
      });
    }
  };

  const handleUserPress = (userId: string) => {
    router.push(`/profile/${userId}` as any);
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const isFollowing = followingStates[item.id] || item.isFollowing || false;
    const isOwnProfile = item.isOwnProfile || item.id === user?.id;

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
              isFollowing
                ? { borderColor, backgroundColor: 'transparent' }
                : { backgroundColor: primaryColor },
            ]}
            onPress={(e) => {
              e.stopPropagation();
              handleFollow(item.id);
            }}
          >
            <ThemedText
              style={[
                styles.followButtonText,
                isFollowing ? { color: primaryColor } : { color: '#FFFFFF' },
              ]}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </ThemedText>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 30 }]}>
        <ThemedText style={styles.headerTitle}>Search Users</ThemedText>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: inputBackgroundColor, borderColor: inputBorderColor }]}>
          <IconSymbol name="magnifyingglass" size={20} color={mutedColor} />
          <TextInput
            style={[styles.searchInput, { color: useThemeColor({}, 'text') }]}
            placeholder="Search by username..."
            placeholderTextColor={mutedColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol name="xmark.circle.fill" size={20} color={mutedColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {loading && searchQuery.length > 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={[styles.loadingText, { color: mutedColor }]}>
            Searching...
          </ThemedText>
        </View>
      ) : searchQuery.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="magnifyingglass" size={64} color={mutedColor} style={styles.emptyIcon} />
          <ThemedText style={styles.emptyTitle}>Search for users</ThemedText>
          <ThemedText style={[styles.emptyText, { color: mutedColor }]}>
            Enter a username to find users on Melodi
          </ThemedText>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="person.crop.circle.badge.questionmark" size={64} color={mutedColor} style={styles.emptyIcon} />
          <ThemedText style={styles.emptyTitle}>No users found</ThemedText>
          <ThemedText style={[styles.emptyText, { color: mutedColor }]}>
            Try a different search term
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
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
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 34,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
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


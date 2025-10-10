import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

interface FeedPost {
  post_id: number;
  user_id: string;
  content: string;
  like_count: number;
  visibility: string;
  created_at: string;
  updated_at: string;
  users: {
    id: string;
    username: string;
    display_name: string | null;
  };
  songs: {
    song_id: string;
    spotify_id: string;
    song_name: string;
    artist_name: string;
    album_name: string | null;
    cover_art_url: string | null;
  };
}


export default function FeedScreen() {
  const [feedData, setFeedData] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mutedColor = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API.BACKEND_URL}/api/posts`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setFeedData(data.posts || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleLike = (postId: number) => {
    setFeedData(prevData =>
      prevData.map(post =>
        post.post_id === postId
          ? { ...post, like_count: post.like_count + 1 }
          : post
      )
    );
  };

  const handleComment = (postId: number) => {
    // Navigate to comments or show comment modal
    console.log('Navigate to comments for post:', postId);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const renderPost = (post: FeedPost) => (
    <View key={post.post_id} style={styles.postContainer}>
      {/* User Header */}
      <View style={styles.userHeader}>
        <View style={styles.avatarPlaceholder}>
          <IconSymbol name="person.fill" size={16} color={mutedColor} />
        </View>
        <View style={styles.userInfo}>
          <ThemedText style={styles.username}>
            {post.users.display_name || post.users.username}
          </ThemedText>
          <ThemedText style={styles.timestamp}>
            {formatTimestamp(post.created_at)}
          </ThemedText>
        </View>
      </View>

      {/* Post Content */}
      <ThemedText style={styles.postContent}>{post.content}</ThemedText>

      {/* Song Card */}
      <View style={styles.songCard}>
        <Image
          source={{ uri: post.songs.cover_art_url || 'https://via.placeholder.com/40' }}
          style={styles.songImage}
        />
        <View style={styles.songInfo}>
          <ThemedText style={styles.songTitle}>{post.songs.song_name}</ThemedText>
          <ThemedText style={styles.songArtist}>{post.songs.artist_name}</ThemedText>
        </View>
        <TouchableOpacity style={styles.playButton}>
          <IconSymbol name="play.fill" size={18} color={primaryColor} />
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(post.post_id)}
        >
          <IconSymbol name="heart" size={16} color={mutedColor} />
          <ThemedText style={styles.actionText}>{post.like_count}</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleComment(post.post_id)}
        >
          <IconSymbol name="bubble.left" size={16} color={mutedColor} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Small Banner */}
      <View style={styles.banner}>
        <ThemedText style={styles.bannerText}>Melodi</ThemedText>
      </View>
      
      <View style={styles.feedContainer}>
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={primaryColor} />
            <ThemedText style={styles.loadingText}>Loading posts...</ThemedText>
          </View>
        ) : error ? (
          <View style={styles.errorState}>
            <IconSymbol 
              name="exclamationmark.triangle" 
              size={48} 
              color={mutedColor} 
              style={styles.errorIcon}
            />
            <ThemedText style={styles.errorTitle}>Failed to load posts</ThemedText>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchPosts}
            >
              <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
            </TouchableOpacity>
          </View>
        ) : feedData.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol 
              name="music.note.list" 
              size={48} 
              color={mutedColor} 
              style={styles.emptyStateIcon}
            />
            <ThemedText style={styles.emptyStateTitle}>No posts yet</ThemedText>
            <ThemedText style={styles.emptyStateText}>
              When your friends start sharing music, their posts will appear here.
            </ThemedText>
          </View>
        ) : (
          feedData.map(renderPost)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 20,
  },
  banner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  bannerText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  feedContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  postContainer: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.5,
    marginTop: 1,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    marginBottom: 8,
  },
  songImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 10,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 1,
  },
  songArtist: {
    fontSize: 11,
    opacity: 0.6,
  },
  playButton: {
    padding: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    marginBottom: 12,
    opacity: 0.4,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 12,
  },
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorIcon: {
    marginBottom: 12,
    opacity: 0.4,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
});

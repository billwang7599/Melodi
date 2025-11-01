import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API } from '@/constants/theme';
import { postCardStyles } from '@/styles/postCardStyles';
import { FeedPost } from '@/types/feed';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';

interface PostCardProps {
  post: FeedPost;
  onLike: (postId: number, newLikeCount: number, isLiked: boolean) => void;
  onComment: (postId: number) => void;
  surfaceColor: string;
  mutedColor: string;
  primaryColor: string;
  authToken?: string;
}

export function PostCard({ 
  post, 
  onLike, 
  onComment, 
  surfaceColor, 
  mutedColor, 
  primaryColor,
  authToken
}: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  
  // Use the isLiked field directly from the API response
  const isLiked = post.isLiked || false;

  const handleLike = async () => {
    if (!authToken) {
      Alert.alert('Error', 'You must be logged in to like posts');
      return;
    }

    if (isLiking) return; // Prevent multiple simultaneous requests

    try {
      setIsLiking(true);
      
      const response = await fetch(`${API.BACKEND_URL}/api/posts/${post.post_id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to like post`);
      }

      const result = await response.json();
      
      // Call the parent's onLike callback with the new like count and like status
      onLike(post.post_id, result.likeCount, result.isLiked);
      
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to like post');
    } finally {
      setIsLiking(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  return (
    <View style={[postCardStyles.postContainer, { backgroundColor: surfaceColor }]}>
      {/* User Header */}
      <View style={postCardStyles.userHeader}>
        <View style={postCardStyles.avatarPlaceholder}>
          <IconSymbol name="person.circle.fill" size={40} color={mutedColor} />
        </View>
        <ThemedText style={postCardStyles.listeningText}>
          <ThemedText style={postCardStyles.username}>@{post.users.username}</ThemedText>
          {' is listening to'}
        </ThemedText>
      </View>

      {/* Song Card with cream/beige background */}
      <View style={postCardStyles.songCardContainer}>
        <View style={postCardStyles.songCardTop}>
          {/* Large Album Art */}
          <Image
            source={{ uri: post.songs.cover_art_url || 'https://via.placeholder.com/120' }}
            style={postCardStyles.largeAlbumArt}
          />
          
          {/* Song Info beside artwork */}
          <View style={postCardStyles.songInfoBeside}>
            <ThemedText style={postCardStyles.songTitleLarge}>{post.songs.song_name}</ThemedText>
            <ThemedText style={postCardStyles.artistName}>{post.songs.artist_name}</ThemedText>
          </View>
        </View>

        {/* Play Controls */}
        <View style={postCardStyles.playControls}>
          <TouchableOpacity style={postCardStyles.playButton}>
            <IconSymbol name="play.fill" size={14} color={primaryColor} />
          </TouchableOpacity>
          <View style={postCardStyles.progressBar}>
            <View style={[postCardStyles.progressFill, { backgroundColor: primaryColor }]} />
          </View>
          <View style={postCardStyles.timestampBadge}>
            <ThemedText style={postCardStyles.timestampText}>{formatTimestamp(post.created_at)}</ThemedText>
          </View>
        </View>

        {/* Description */}
        <ThemedText style={postCardStyles.description}>
          {post.content}
        </ThemedText>
      </View>

      {/* Action Buttons */}
      <View style={postCardStyles.actionsContainer}>
        <View style={postCardStyles.leftActions}>
          <TouchableOpacity
            style={postCardStyles.actionButton}
            onPress={handleLike}
            disabled={isLiking}
          >
            <IconSymbol 
              name={isLiked ? "heart.fill" : "heart"} 
              size={24} 
              color={isLiked ? primaryColor : mutedColor} 
            />
            <ThemedText style={postCardStyles.actionCount}>{post.like_count}</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={postCardStyles.actionButton}
            onPress={() => onComment(post.post_id)}
          >
            <IconSymbol name="bubble.left" size={24} color={mutedColor} />
            <ThemedText style={postCardStyles.actionCount}>0</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={postCardStyles.rightActions}>
          <TouchableOpacity style={postCardStyles.iconButton}>
            <IconSymbol name="bookmark" size={24} color={mutedColor} />
          </TouchableOpacity>
          <TouchableOpacity style={postCardStyles.iconButton}>
            <IconSymbol name="ellipsis" size={24} color={mutedColor} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
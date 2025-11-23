import { SpotifyEmbed } from "@/components/feed/SpotifyEmbed";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { API } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { postCardStyles } from "@/styles/postCardStyles";
import { Comment, FeedPost } from "@/types/feed";
import { useState } from "react";
import { Alert, TouchableOpacity, View } from "react-native";
import { CommentInput } from "./CommentInput";
import { CommentsList } from "./CommentsList";

interface PostCardProps {
  post: FeedPost;
  onLike: (postId: number, newLikeCount: number, isLiked: boolean) => void;
  onComment: (postId: number) => void;
  onCommentAdded: (postId: number, comment: Comment) => void;
  surfaceColor: string;
  mutedColor: string;
  primaryColor: string;
  textColor: string;
  borderColor: string;
  authToken?: string;
}

export function PostCard({
  post,
  onLike,
  onComment,
  onCommentAdded,
  mutedColor,
  primaryColor,
  textColor,
  borderColor,
  authToken,
}: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);

  // Use the isLiked field directly from the API response
  const isLiked = post.isLiked || false;

  const handleLike = async () => {
    if (!authToken) {
      Alert.alert("Error", "You must be logged in to like posts");
      return;
    }

    if (isLiking) return; // Prevent multiple simultaneous requests

    try {
      setIsLiking(true);

      const response = await fetch(
        `${API.BACKEND_URL}/api/posts/${post.post_id}/like`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: Failed to like post`
        );
      }

      const result = await response.json();

      // Call the parent's onLike callback with the new like count and like status
      onLike(post.post_id, result.likeCount, result.isLiked);
    } catch (error) {
      console.error("Error liking post:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to like post"
      );
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentSubmit = async (body: string) => {
    if (!authToken) {
      Alert.alert("Error", "You must be logged in to comment");
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(
        `${API.BACKEND_URL}/api/posts/${post.post_id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ body }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `HTTP ${response.status}: Failed to create comment`
        );
      }

      const result = await response.json();

      // Call the parent's onCommentAdded callback with the new comment
      onCommentAdded(post.post_id, result.comment);

      // Hide the comment input after successful submission
      setShowCommentInput(false);
    } catch (error) {
      console.error("Error creating comment:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to create comment"
      );
      throw error;
    }
  };

  const handleCommentButtonClick = () => {
    if (!authToken) {
      Alert.alert("Error", "You must be logged in to comment");
      return;
    }
    setShowCommentInput(!showCommentInput);
    onComment(post.post_id);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
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

  const shadowColor = useThemeColor({}, "shadow");
  const accentColor = useThemeColor({}, "accent");

  return (
    <View style={[postCardStyles.postContainer, { shadowColor }]}>
      {/* User Header */}
      <View style={postCardStyles.userHeader}>
        <View
          style={[
            postCardStyles.avatarPlaceholder,
            { backgroundColor: accentColor },
          ]}
        >
          <IconSymbol name="person.circle.fill" size={40} color={mutedColor} />
        </View>
        <View style={postCardStyles.headerTextContainer}>
          <ThemedText style={postCardStyles.timestamp}>
            {formatTimestamp(post.created_at)}
          </ThemedText>
          <ThemedText style={postCardStyles.listeningText}>
            <ThemedText style={postCardStyles.username}>
              @{post.users.username}
            </ThemedText>
            {" is listening to"}
          </ThemedText>
        </View>
      </View>

      {/* Song Card */}

      {post.songs.song_id && (
        <SpotifyEmbed trackId={post.songs.spotify_id || ""} />
      )}
      <ThemedText style={postCardStyles.description}>{post.content}</ThemedText>
      {/* <View style={postCardStyles.songCardTop}>
          <Image
            source={{ uri: post.songs.cover_art_url || 'https://via.placeholder.com/120' }}
            style={postCardStyles.largeAlbumArt}
          />
          
          <View style={postCardStyles.songInfoBeside}>
            <ThemedText style={postCardStyles.songTitleLarge}>{post.songs.song_name}</ThemedText>
            <ThemedText style={postCardStyles.artistName}>{post.songs.artist_name}</ThemedText>
          </View>
        </View>

        <View style={postCardStyles.playControls}>
          <TouchableOpacity style={postCardStyles.playButton}>
            <IconSymbol name="play.fill" size={14} color={primaryColor} />
          </TouchableOpacity>
          <View style={[postCardStyles.progressBar, { backgroundColor: mutedColor }]}>
            <View style={[postCardStyles.progressFill, { backgroundColor: primaryColor }]} />
          </View>
          <View style={[postCardStyles.timestampBadge, { backgroundColor: accentColor }]}>
            <ThemedText style={postCardStyles.timestampText}>{formatTimestamp(post.created_at)}</ThemedText>
          </View>
        </View>

        <ThemedText style={postCardStyles.description}>
          {post.content}
        </ThemedText> */}

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
            <ThemedText style={postCardStyles.actionCount}>
              {post.like_count}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={postCardStyles.actionButton}
            onPress={handleCommentButtonClick}
          >
            <IconSymbol
              name="bubble.left"
              size={24}
              color={showCommentInput ? primaryColor : mutedColor}
            />
            <ThemedText style={postCardStyles.actionCount}>
              {post.comments?.length || 0}
            </ThemedText>
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

      {/* Comment Input */}
      {showCommentInput && (
        <CommentInput
          onSubmit={handleCommentSubmit}
          mutedColor={mutedColor}
          primaryColor={primaryColor}
          textColor={textColor}
          borderColor={borderColor}
        />
      )}

      {/* Comments Section */}
      {post.comments && post.comments.length > 0 && (
        <CommentsList comments={post.comments} mutedColor={mutedColor} />
      )}
    </View>
  );
}

import { SpotifyEmbed } from "@/components/feed/SpotifyEmbed";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { API } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useSpotifyAPI } from "@/lib/spotify";
import { postCardStyles } from "@/styles/postCardStyles";
import { AlbumRanking, Comment, FeedPost } from "@/types/feed";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from "react-native";
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
  surfaceColor,
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
  const spotifyAPI = useSpotifyAPI();
  const [rankedSongsData, setRankedSongsData] = useState<Array<{ spotifyId: string; name: string; artist: string; rank: number; albumCoverUrl: string }>>([]);
  const [isLoadingRankings, setIsLoadingRankings] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [albumCoverUrl, setAlbumCoverUrl] = useState<string>("");
  const [albumName, setAlbumName] = useState<string>("");
  const [albumArtist, setAlbumArtist] = useState<string>("");
  const isAlbumPost = !!post.album_id && post.albumRankings && post.albumRankings.length > 0;

  // Fetch song details for album rankings
  useEffect(() => {
    if (isAlbumPost && post.albumRankings) {
      const fetchRankedSongs = async () => {
        setIsLoadingRankings(true);
        try {
          // First, get album info to get the cover art, name, and artist
          let albumCover = "";
          if (post.album_id) {
            try {
              const albumData = await spotifyAPI.getAlbum(post.album_id);
              albumCover = albumData.images?.[0]?.url || albumData.images?.[1]?.url || "";
              setAlbumCoverUrl(albumCover);
              setAlbumName(albumData.name || "");
              setAlbumArtist(albumData.artists?.map((a: any) => a.name).join(", ") || "");
            } catch (error) {
              console.error("Error fetching album:", error);
            }
          }

          const songsData = await Promise.all(
            post.albumRankings!.map(async (ranking: AlbumRanking) => {
              try {
                const trackData = await spotifyAPI.getTrack(ranking.spotify_id);
                // Use album cover from track if we don't have it from album
                const coverUrl = albumCover || trackData.album?.images?.[0]?.url || trackData.album?.images?.[1]?.url || "";
                if (!albumCover && coverUrl) {
                  setAlbumCoverUrl(coverUrl);
                }
                return {
                  spotifyId: ranking.spotify_id,
                  name: trackData.name,
                  artist: trackData.artists.map((a: any) => a.name).join(", "),
                  rank: ranking.rank,
                  albumCoverUrl: coverUrl,
                };
              } catch (error) {
                console.error(`Error fetching track ${ranking.spotify_id}:`, error);
                return {
                  spotifyId: ranking.spotify_id,
                  name: "Unknown",
                  artist: "Unknown",
                  rank: ranking.rank,
                  albumCoverUrl: albumCover,
                };
              }
            })
          );
          setRankedSongsData(songsData.sort((a, b) => a.rank - b.rank));
        } catch (error) {
          console.error("Error fetching ranked songs:", error);
        } finally {
          setIsLoadingRankings(false);
        }
      };
      fetchRankedSongs();
    }
  }, [isAlbumPost, post.albumRankings, post.album_id, spotifyAPI]);

  const rankingStyles = StyleSheet.create({
    albumRankingContainer: {
      borderRadius: 20,
      padding: 16,
      marginBottom: 12,
      backgroundColor: surfaceColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    albumRankingHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      gap: 12,
    },
    albumRankingTitle: {
      fontSize: 20,
      fontWeight: "700",
      flex: 1,
      letterSpacing: -0.3,
    },
    rankingList: {
      gap: 8,
    },
    rankingItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: "transparent",
    },
    rankBadge: {
      width: 32,
      alignItems: "flex-start",
      justifyContent: "center",
      marginRight: 16,
    },
    rankText: {
      color: primaryColor,
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: -0.3,
    },
    albumCoverImage: {
      width: 52,
      height: 52,
      borderRadius: 10,
      marginRight: 14,
      backgroundColor: mutedColor + "15",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    songInfo: {
      flex: 1,
    },
    songName: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 3,
      lineHeight: 22,
      letterSpacing: -0.2,
    },
    songArtist: {
      fontSize: 14,
      color: mutedColor,
      lineHeight: 20,
      letterSpacing: -0.1,
    },
    expandButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: "transparent",
    },
    expandButtonText: {
      fontSize: 15,
      fontWeight: "600",
      marginLeft: 8,
      letterSpacing: -0.2,
    },
  });

  const displayedSongs = isExpanded ? rankedSongsData : rankedSongsData.slice(0, 3);
  const hasMoreSongs = rankedSongsData.length > 3;

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
        </View>
        <View style={postCardStyles.headerTextContainer}>
          <ThemedText style={postCardStyles.timestamp}>
            {formatTimestamp(post.created_at)}
          </ThemedText>
          <ThemedText style={postCardStyles.listeningText}>
            <ThemedText style={postCardStyles.username}>
              @{post.users.username}
            </ThemedText>
            {isAlbumPost ? " ranked an album" : " is listening to"}
          </ThemedText>
        </View>
      </View>

      {/* Album Ranking Display */}
      {isAlbumPost && (
        <View style={[rankingStyles.albumRankingContainer, { shadowColor }]}>
          <View style={rankingStyles.albumRankingHeader}>
            <View style={{ flex: 1 }}>
              <ThemedText style={[rankingStyles.albumRankingTitle, { color: textColor }]}>
                Album Ranking
              </ThemedText>
              {(albumName || albumArtist) && (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
                  {albumName && (
                    <ThemedText style={{ fontSize: 16, fontWeight: "600", color: textColor }}>
                      {albumName}
                    </ThemedText>
                  )}
                  {albumName && albumArtist && (
                    <ThemedText style={{ fontSize: 16, color: mutedColor, marginHorizontal: 6 }}>
                      •
                    </ThemedText>
                  )}
                  {albumArtist && (
                    <ThemedText style={{ fontSize: 14, color: mutedColor }}>
                      {albumArtist}
                    </ThemedText>
                  )}
                </View>
              )}
            </View>
          </View>
          {isLoadingRankings ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <ActivityIndicator size="small" color={primaryColor} />
            </View>
          ) : rankedSongsData.length > 0 ? (
            <>
              <View style={rankingStyles.rankingList}>
                {displayedSongs.map((song, index) => {
                  // Subtle background variation for visual separation without borders
                  const itemBackground = index % 2 === 0 
                    ? accentColor + "04" 
                    : "transparent";
                  
                  return (
                    <View 
                      key={song.spotifyId} 
                      style={[
                        rankingStyles.rankingItem,
                        { backgroundColor: itemBackground }
                      ]}
                    >
                      <View style={rankingStyles.rankBadge}>
                        <ThemedText style={rankingStyles.rankText}>
                          {song.rank}
                        </ThemedText>
                      </View>
                      {song.albumCoverUrl ? (
                        <Image
                          source={{ uri: song.albumCoverUrl }}
                          style={rankingStyles.albumCoverImage}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={[rankingStyles.albumCoverImage, { backgroundColor: mutedColor + "15" }]} />
                      )}
                      <View style={rankingStyles.songInfo}>
                        <ThemedText style={[rankingStyles.songName, { color: textColor }]} numberOfLines={1}>
                          {song.name}
                        </ThemedText>
                        <ThemedText style={rankingStyles.songArtist} numberOfLines={1}>
                          {song.artist}
                        </ThemedText>
                      </View>
                    </View>
                  );
                })}
              </View>
              {hasMoreSongs && (
                <TouchableOpacity
                  style={rankingStyles.expandButton}
                  onPress={() => setIsExpanded(!isExpanded)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    name={isExpanded ? "chevron.up" : "chevron.down"}
                    size={18}
                    color={mutedColor}
                  />
                  <ThemedText style={[rankingStyles.expandButtonText, { color: mutedColor }]}>
                    {isExpanded ? "Show Less" : `View All ${rankedSongsData.length} Songs`}
                  </ThemedText>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <ThemedText style={{ color: mutedColor, fontSize: 13, textAlign: "center", paddingVertical: 20 }}>
              Loading rankings...
            </ThemedText>
          )}
        </View>
      )}

      {/* Song Card */}
      {post.songs?.song_id && !isAlbumPost && (
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

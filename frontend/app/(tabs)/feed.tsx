import { Fragment, useEffect, useState } from "react";
import { Alert, ScrollView, Switch, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AlbumRankingModal } from "@/components/feed/AlbumRankingModal";
import { AlbumSearchModal, SpotifyAlbumSearchResult } from "@/components/feed/AlbumSearchModal";
import { CreatePostForm } from "@/components/feed/CreatePostForm";
import { FeedState } from "@/components/feed/FeedState";
import { PostCard } from "@/components/feed/PostCard";
import { SongSearchModal } from "@/components/feed/SongSearchModal";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { API } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useSpotifyAPI } from "@/lib/spotify";
import { feedStyles } from "@/styles/feedStyles";
import { Comment, FeedPost, RankedSong, SelectedAlbum, SelectedSong, SpotifyAlbum, SpotifyTrack } from "@/types/feed";

export default function FeedScreen() {
  const [feedData, setFeedData] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postContent, setPostContent] = useState("");
  const [selectedSong, setSelectedSong] = useState<SelectedSong | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<SelectedAlbum | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAlbumSearchModal, setShowAlbumSearchModal] = useState(false);
  const [albumSearchQuery, setAlbumSearchQuery] = useState("");
  const [albumSearchResults, setAlbumSearchResults] = useState<SpotifyAlbumSearchResult[]>([]);
  const [isAlbumSearching, setIsAlbumSearching] = useState(false);
  const [showAlbumRankingModal, setShowAlbumRankingModal] = useState(false);
  const [selectedAlbumForRanking, setSelectedAlbumForRanking] = useState<SpotifyAlbum | null>(null);
  const [isLoadingAlbum, setIsLoadingAlbum] = useState(false);
  const [showFollowingOnly, setShowFollowingOnly] = useState(false);
  const mutedColor = useThemeColor({}, "textMuted");
  const primaryColor = useThemeColor({}, "primary");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "border");
  const accentColor = useThemeColor({}, "accent");
  const { user, token } = useAuth();
  const surfaceColor = useThemeColor({}, "surface");
  const spotifyAPI = useSpotifyAPI();
  const insets = useSafeAreaInsets();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers: Record<string, string> = {
        "ngrok-skip-browser-warning": "true",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const url = new URL(`${API.BACKEND_URL}/api/posts`);
      if (showFollowingOnly && token) {
        url.searchParams.append("following", "true");
      }

      const response = await fetch(url.toString(), {
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const posts = data.posts || [];

      // Fetch comments for each post
      const postsWithComments = await Promise.all(
        posts.map(async (post: FeedPost) => {
          try {
            const commentsResponse = await fetch(
              `${API.BACKEND_URL}/api/posts/${post.post_id}/comments`,
              { headers }
            );

            if (commentsResponse.ok) {
              const commentsData = await commentsResponse.json();
              return { ...post, comments: commentsData.comments || [] };
            }
            return { ...post, comments: [] };
          } catch (err) {
            console.error(
              `Error fetching comments for post ${post.post_id}:`,
              err
            );
            return { ...post, comments: [] };
          }
        })
      );

      setFeedData(postsWithComments);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [showFollowingOnly]);

  const handleLike = (
    postId: number,
    newLikeCount: number,
    isLiked: boolean
  ) => {
    setFeedData((prevData) =>
      prevData.map((post) =>
        post.post_id === postId
          ? { ...post, like_count: newLikeCount, isLiked: isLiked }
          : post
      )
    );
  };

  const handleComment = (postId: number) => {
    // Navigate to comments or show comment modal
    console.log("Navigate to comments for post:", postId);
  };

  const handleCommentAdded = (postId: number, comment: Comment) => {
    setFeedData((prevData) =>
      prevData.map((post) =>
        post.post_id === postId
          ? {
              ...post,
              comments: [...(post.comments || []), comment],
            }
          : post
      )
    );
  };

  const handleCreatePost = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to create a post");
      return;
    }

    if (!selectedSong && !selectedAlbum) {
      Alert.alert("Error", "Please select a song or album for your post");
      return;
    }

    try {
      setIsPosting(true);

      const requestBody: any = {
        content: postContent.trim() || "",
        visibility: "public",
      };

      if (selectedSong) {
        requestBody.spotifyId = selectedSong.spotifyId;
      } else if (selectedAlbum) {
        // Get the top-ranked song (rank 1) for the main song display
        const topRankedSong = selectedAlbum.rankedSongs
          .filter(song => song.rank > 0)
          .sort((a, b) => a.rank - b.rank)[0];
        
        if (!topRankedSong) {
          Alert.alert("Error", "Please rank at least one song from the album");
          setIsPosting(false);
          return;
        }

        // Send top-ranked song's spotifyId for main song display
        requestBody.spotifyId = topRankedSong.spotifyId;
        // Send album ID and full rankings for storage
        requestBody.albumId = selectedAlbum.spotifyId;
        requestBody.albumRankings = selectedAlbum.rankedSongs
          .filter(song => song.rank > 0)
          .sort((a, b) => a.rank - b.rank)
          .map(song => ({
            spotifyId: song.spotifyId,
            rank: song.rank,
          }));
      }

      const response = await fetch(`${API.BACKEND_URL}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Post creation error:", errorData);
        throw new Error(
          errorData.message || `HTTP ${response.status}: Failed to create post`
        );
      }

      const result = await response.json();

      // Clear form
      setPostContent("");
      setSelectedSong(null);
      setSelectedAlbum(null);

      // Refresh feed
      await fetchPosts();

      Alert.alert("Success", "Post created successfully!");
    } catch (err) {
      console.error("Error creating post:", err);
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to create post"
      );
    } finally {
      setIsPosting(false);
    }
  };

  const handleSelectSong = () => {
    setShowSearchModal(true);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await spotifyAPI.search(query, "track", 20);
      setSearchResults(response.tracks.items);
    } catch (error) {
      console.error("Error searching tracks:", error);
      Alert.alert("Error", "Failed to search for tracks. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSongSelect = (track: SpotifyTrack) => {
    setSelectedSong({
      spotifyId: track.id,
      name: track.name,
      artist: track.artists.map((artist) => artist.name).join(", "),
    });
    setShowSearchModal(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleCloseSearchModal = () => {
    setShowSearchModal(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSelectAlbum = () => {
    setShowAlbumSearchModal(true);
  };

  const handleAlbumSearch = async (query: string) => {
    if (!query.trim()) {
      setAlbumSearchResults([]);
      return;
    }

    try {
      setIsAlbumSearching(true);
      const response = await spotifyAPI.search(query, "album", 20);
      setAlbumSearchResults(response.albums.items);
    } catch (error) {
      console.error("Error searching albums:", error);
      Alert.alert("Error", "Failed to search for albums. Please try again.");
    } finally {
      setIsAlbumSearching(false);
    }
  };

  const handleAlbumSelect = async (album: SpotifyAlbumSearchResult) => {
    try {
      setIsLoadingAlbum(true);
      setShowAlbumSearchModal(false);
      
      // Fetch full album details including tracks
      const albumData = await spotifyAPI.getAlbum(album.id);
      setSelectedAlbumForRanking(albumData);
      setShowAlbumRankingModal(true);
    } catch (error) {
      console.error("Error fetching album:", error);
      Alert.alert("Error", "Failed to load album. Please try again.");
    } finally {
      setIsLoadingAlbum(false);
    }
  };

  const handleAlbumRankingConfirm = (rankedSongs: RankedSong[]) => {
    if (!selectedAlbumForRanking) return;

    setSelectedAlbum({
      spotifyId: selectedAlbumForRanking.id,
      name: selectedAlbumForRanking.name,
      artist: selectedAlbumForRanking.artists.map(a => a.name).join(", "),
      coverArtUrl: selectedAlbumForRanking.images[0]?.url || "",
      rankedSongs,
    });

    setShowAlbumRankingModal(false);
    setSelectedAlbumForRanking(null);
  };

  const handleCloseAlbumSearchModal = () => {
    setShowAlbumSearchModal(false);
    setAlbumSearchQuery("");
    setAlbumSearchResults([]);
  };

  const handleCloseAlbumRankingModal = () => {
    setShowAlbumRankingModal(false);
    setSelectedAlbumForRanking(null);
  };

  return (
    <ThemedView style={feedStyles.container}>
      <ScrollView
        style={feedStyles.scrollView}
        contentContainerStyle={feedStyles.contentContainer}
      >
        {/* Header */}
        <View style={[feedStyles.header, { paddingTop: insets.top + 30 }]}>
          <ThemedText style={feedStyles.headerTitle}>
            Good{" "}
            {new Date().getHours() < 12
              ? "morning"
              : new Date().getHours() < 18
              ? "afternoon"
              : "evening"}
            , {user?.user_metadata?.username}!
          </ThemedText>
        </View>

        {/* Feed Filter Toggle */}
        {user && token && (
          <View style={[feedStyles.feedContainer, { paddingVertical: 12 }]}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: surfaceColor,
                borderRadius: 12,
              }}
            >
              <ThemedText style={{ fontSize: 16, color: textColor }}>
                Show only posts from people I follow
              </ThemedText>
              <Switch
                value={showFollowingOnly}
                onValueChange={setShowFollowingOnly}
                trackColor={{ false: mutedColor + "40", true: primaryColor + "80" }}
                thumbColor={showFollowingOnly ? primaryColor : "#f4f3f4"}
              />
            </View>
          </View>
        )}

        {/* Create Post Section */}
        <View style={feedStyles.feedContainer}>
          <CreatePostForm
            postContent={postContent}
            setPostContent={setPostContent}
            selectedSong={selectedSong}
            selectedAlbum={selectedAlbum}
            onSelectSong={handleSelectSong}
            onSelectAlbum={handleSelectAlbum}
            onRemoveSong={() => setSelectedSong(null)}
            onRemoveAlbum={() => setSelectedAlbum(null)}
            onCreatePost={handleCreatePost}
            isPosting={isPosting}
            mutedColor={mutedColor}
            primaryColor={primaryColor}
            surfaceColor={surfaceColor}
            textColor={textColor}
            borderColor={borderColor}
            accentColor={accentColor}
          />
        </View>

        <View style={feedStyles.feedContainer}>
          <FeedState
            loading={loading}
            error={error}
            feedDataLength={feedData.length}
            onRetry={fetchPosts}
            primaryColor={primaryColor}
            mutedColor={mutedColor}
          />

          {!loading && !error && feedData.length > 0 && (
            <>
              {feedData.map((post, index) => (
                <Fragment key={post.post_id}>
                  <PostCard
                    post={post}
                    onLike={handleLike}
                    onComment={handleComment}
                    onCommentAdded={handleCommentAdded}
                    surfaceColor={surfaceColor}
                    mutedColor={mutedColor}
                    primaryColor={primaryColor}
                    textColor={textColor}
                    borderColor={borderColor}
                    authToken={token || undefined}
                  />

                  {index < feedData.length - 1 && (
                    <View
                      style={{
                        height: 2,
                        width: "95%",
                        backgroundColor: mutedColor + "20", // subtle opacity
                        marginVertical: 10,
                        borderRadius: 4,
                        alignSelf: "center",
                      }}
                    />
                  )}
                </Fragment>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* Song Search Modal */}
      <SongSearchModal
        visible={showSearchModal}
        searchQuery={searchQuery}
        setSearchQuery={(text) => {
          setSearchQuery(text);
          handleSearch(text);
        }}
        searchResults={searchResults}
        isSearching={isSearching}
        onSongSelect={handleSongSelect}
        onClose={handleCloseSearchModal}
        mutedColor={mutedColor}
        primaryColor={primaryColor}
        insets={insets}
      />

      {/* Album Search Modal */}
      <AlbumSearchModal
        visible={showAlbumSearchModal}
        searchQuery={albumSearchQuery}
        setSearchQuery={(text) => {
          setAlbumSearchQuery(text);
          handleAlbumSearch(text);
        }}
        searchResults={albumSearchResults}
        isSearching={isAlbumSearching}
        onAlbumSelect={handleAlbumSelect}
        onClose={handleCloseAlbumSearchModal}
        mutedColor={mutedColor}
        primaryColor={primaryColor}
        insets={insets}
      />

      {/* Album Ranking Modal */}
      <AlbumRankingModal
        visible={showAlbumRankingModal}
        album={selectedAlbumForRanking}
        isLoading={isLoadingAlbum}
        onConfirm={handleAlbumRankingConfirm}
        onClose={handleCloseAlbumRankingModal}
        mutedColor={mutedColor}
        primaryColor={primaryColor}
        textColor={textColor}
        surfaceColor={surfaceColor}
        borderColor={borderColor}
        insets={insets}
      />
    </ThemedView>
  );
}

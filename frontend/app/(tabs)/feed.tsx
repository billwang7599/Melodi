import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSpotifyAPI } from '@/lib/spotify';

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

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  external_urls: {
    spotify: string;
  };
}


export default function FeedScreen() {
  const [feedData, setFeedData] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postContent, setPostContent] = useState('');
  const [selectedSong, setSelectedSong] = useState<{spotifyId: string, name: string, artist: string} | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const mutedColor = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');
  const { user, token } = useAuth();
  const spotifyAPI = useSpotifyAPI();

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

  const handleCreatePost = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a post');
      return;
    }

    if (!postContent.trim()) {
      Alert.alert('Error', 'Please enter some content for your post');
      return;
    }

    if (!selectedSong) {
      Alert.alert('Error', 'Please select a song for your post');
      return;
    }

    try {
      setIsPosting(true);
      
      console.log('Creating post with data:', {
        content: postContent.trim(),
        spotifyId: selectedSong.spotifyId,
        visibility: 'public'
      });
      
      const response = await fetch(`${API.BACKEND_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          content: postContent.trim(),
          spotifyId: selectedSong.spotifyId,
          visibility: 'public'
        })
      });

      console.log('Post creation response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Post creation error:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to create post`);
      }

      const result = await response.json();
      console.log('Post created successfully:', result);

      // Clear form
      setPostContent('');
      setSelectedSong(null);
      
      // Refresh feed
      await fetchPosts();
      
      Alert.alert('Success', 'Post created successfully!');
    } catch (err) {
      console.error('Error creating post:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create post');
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
      const response = await spotifyAPI.search(query, 'track', 20);
      setSearchResults(response.tracks.items);
    } catch (error) {
      console.error('Error searching tracks:', error);
      Alert.alert('Error', 'Failed to search for tracks. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSongSelect = (track: SpotifyTrack) => {
    setSelectedSong({
      spotifyId: track.id,
      name: track.name,
      artist: track.artists.map(artist => artist.name).join(', ')
    });
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleCloseSearchModal = () => {
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
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
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Small Banner */}
        <View style={styles.banner}>
          <ThemedText style={styles.bannerText}>Melodi</ThemedText>
        </View>
      
      {/* Create Post Section */}
      <View style={styles.createPostContainer}>
        <View style={styles.createPostHeader}>
          <View style={styles.avatarPlaceholder}>
            <IconSymbol name="person.fill" size={16} color={mutedColor} />
          </View>
          <ThemedText style={styles.createPostLabel}>Share what you're listening to</ThemedText>
        </View>
        
        <TextInput
          style={[styles.postInput, { color: mutedColor }]}
          placeholder="What's on your mind?"
          placeholderTextColor={mutedColor}
          value={postContent}
          onChangeText={setPostContent}
          multiline
          maxLength={500}
        />
        
        {selectedSong ? (
          <View style={styles.selectedSongContainer}>
            <ThemedText style={styles.selectedSongText}>
              🎵 {selectedSong.name} - {selectedSong.artist}
            </ThemedText>
            <TouchableOpacity onPress={() => setSelectedSong(null)}>
              <IconSymbol name="xmark.circle.fill" size={16} color={mutedColor} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.selectSongButton} onPress={handleSelectSong}>
            <IconSymbol name="music.note" size={16} color={primaryColor} />
            <ThemedText style={styles.selectSongText}>Select a song</ThemedText>
          </TouchableOpacity>
        )}
        
        <View style={styles.createPostActions}>
          <ThemedText style={styles.characterCount}>{postContent.length}/500</ThemedText>
          <TouchableOpacity
            style={[styles.postButton, (!postContent.trim() || !selectedSong || isPosting) && styles.postButtonDisabled]}
            onPress={handleCreatePost}
            disabled={!postContent.trim() || !selectedSong || isPosting}
          >
            {isPosting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <ThemedText style={styles.postButtonText}>Post</ThemedText>
            )}
          </TouchableOpacity>
        </View>
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

    {/* Song Search Modal */}
    <Modal
      visible={showSearchModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCloseSearchModal}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleCloseSearchModal}>
            <IconSymbol name="xmark" size={20} color={mutedColor} />
          </TouchableOpacity>
          <ThemedText style={styles.modalTitle}>Search for a song</ThemedText>
          <View style={{ width: 20 }} />
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, { color: mutedColor }]}
            placeholder="Search songs..."
            placeholderTextColor={mutedColor}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              handleSearch(text);
            }}
            autoFocus
          />
          {isSearching && (
            <ActivityIndicator size="small" color={primaryColor} style={styles.searchLoader} />
          )}
        </View>

        <ScrollView style={styles.searchResultsContainer}>
          {searchResults.length > 0 ? (
            searchResults.map((track) => (
              <TouchableOpacity
                key={track.id}
                style={styles.searchResultItem}
                onPress={() => handleSongSelect(track)}
              >
                <Image
                  source={{ 
                    uri: track.album.images[0]?.url || 'https://via.placeholder.com/50' 
                  }}
                  style={styles.searchResultImage}
                />
                <View style={styles.searchResultInfo}>
                  <ThemedText style={styles.searchResultTitle}>{track.name}</ThemedText>
                  <ThemedText style={styles.searchResultArtist}>
                    {track.artists.map(artist => artist.name).join(', ')}
                  </ThemedText>
                  <ThemedText style={styles.searchResultAlbum}>{track.album.name}</ThemedText>
                </View>
                <IconSymbol name="chevron.right" size={16} color={mutedColor} />
              </TouchableOpacity>
            ))
          ) : searchQuery.trim() && !isSearching ? (
            <View style={styles.noResultsContainer}>
              <IconSymbol name="music.note" size={32} color={mutedColor} style={styles.noResultsIcon} />
              <ThemedText style={styles.noResultsText}>No songs found</ThemedText>
              <ThemedText style={styles.noResultsSubtext}>Try a different search term</ThemedText>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
    </>
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
  createPostContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.3)',
  },
  createPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  createPostLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    opacity: 0.8,
  },
  postInput: {
    fontSize: 14,
    lineHeight: 20,
    minHeight: 60,
    maxHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    padding: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  selectedSongContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 6,
    marginBottom: 12,
  },
  selectedSongText: {
    fontSize: 12,
    flex: 1,
    opacity: 0.8,
  },
  selectSongButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    marginBottom: 12,
    gap: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  selectSongText: {
    fontSize: 12,
    opacity: 0.8,
  },
  createPostActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  characterCount: {
    fontSize: 11,
    opacity: 0.5,
  },
  postButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    opacity: 0.5,
  },
  postButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'black',
  },
  feedContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  postContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 0.2,
    borderColor: 'rgba(0, 0, 0, 0.2)',
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  searchLoader: {
    marginLeft: 8,
  },
  searchResultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  searchResultImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  searchResultArtist: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 1,
  },
  searchResultAlbum: {
    fontSize: 11,
    opacity: 0.6,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noResultsIcon: {
    marginBottom: 16,
    opacity: 0.4,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
});

import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CreatePostForm } from '@/components/feed/CreatePostForm';
import { FeedState } from '@/components/feed/FeedState';
import { PostCard } from '@/components/feed/PostCard';
import { SongSearchModal } from '@/components/feed/SongSearchModal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSpotifyAPI } from '@/lib/spotify';
import { feedStyles } from '@/styles/feedStyles';
import { Comment, FeedPost, SelectedSong, SpotifyTrack } from '@/types/feed';


export default function FeedScreen() {
  const [feedData, setFeedData] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postContent, setPostContent] = useState('');
  const [selectedSong, setSelectedSong] = useState<SelectedSong | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const mutedColor = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');
  const { user, token } = useAuth();
  const surfaceColor = useThemeColor({}, 'surface');
  const spotifyAPI = useSpotifyAPI();
  const insets = useSafeAreaInsets();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const headers: Record<string, string> = {
        'ngrok-skip-browser-warning': 'true'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API.BACKEND_URL}/api/posts`, {
        headers
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
            console.error(`Error fetching comments for post ${post.post_id}:`, err);
            return { ...post, comments: [] };
          }
        })
      );
      
      setFeedData(postsWithComments);
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

  const handleLike = (postId: number, newLikeCount: number, isLiked: boolean) => {
    setFeedData(prevData =>
      prevData.map(post =>
        post.post_id === postId
          ? { ...post, like_count: newLikeCount, isLiked: isLiked }
          : post
      )
    );
  };

  const handleComment = (postId: number) => {
    // Navigate to comments or show comment modal
    console.log('Navigate to comments for post:', postId);
  };

  const handleCommentAdded = (postId: number, comment: Comment) => {
    setFeedData(prevData =>
      prevData.map(post =>
        post.post_id === postId
          ? { 
              ...post, 
              comments: [...(post.comments || []), comment]
            }
          : post
      )
    );
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Post creation error:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to create post`);
      }

      const result = await response.json();

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


  return (
    <ThemedView style={feedStyles.container}>
      <ScrollView style={feedStyles.scrollView} contentContainerStyle={feedStyles.contentContainer}>
        {/* Header */}
        <View style={[feedStyles.header, { paddingTop: insets.top + 30 }]}>
          <ThemedText style={feedStyles.headerTitle}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.user_metadata?.username}!
          </ThemedText>
        </View>

        {/* Create Post Section */}
        <View style={feedStyles.feedContainer}>
          <CreatePostForm
            postContent={postContent}
            setPostContent={setPostContent}
            selectedSong={selectedSong}
            onSelectSong={handleSelectSong}
            onRemoveSong={() => setSelectedSong(null)}
            onCreatePost={handleCreatePost}
            isPosting={isPosting}
            mutedColor={mutedColor}
            primaryColor={primaryColor}
            surfaceColor={surfaceColor}
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
            feedData.map((post) => (
              <PostCard
                key={post.post_id}
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                onCommentAdded={handleCommentAdded}
                surfaceColor={surfaceColor}
                mutedColor={mutedColor}
                primaryColor={primaryColor}
                authToken={token || undefined}
              />
            ))
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
    </ThemedView>
  );
}

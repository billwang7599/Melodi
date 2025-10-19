import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { createPostStyles } from '@/styles/createPostStyles';
import { SelectedSong } from '@/types/feed';
import { ActivityIndicator, TextInput, TouchableOpacity, View } from 'react-native';

interface CreatePostFormProps {
  postContent: string;
  setPostContent: (content: string) => void;
  selectedSong: SelectedSong | null;
  onSelectSong: () => void;
  onRemoveSong: () => void;
  onCreatePost: () => void;
  isPosting: boolean;
  mutedColor: string;
  primaryColor: string;
  surfaceColor: string;
}

export function CreatePostForm({
  postContent,
  setPostContent,
  selectedSong,
  onSelectSong,
  onRemoveSong,
  onCreatePost,
  isPosting,
  mutedColor,
  primaryColor,
  surfaceColor,
}: CreatePostFormProps) {
  return (
    <View style={[createPostStyles.createPostContainer, { backgroundColor: surfaceColor }]}>
      <TextInput
        style={[createPostStyles.postInput, { color: '#1F2937', borderColor: '#E5E7EB' }]}
        placeholder="What's on your mind?"
        placeholderTextColor="#9CA3AF"
        value={postContent}
        onChangeText={setPostContent}
        multiline
        maxLength={500}
      />
      
      {selectedSong ? (
        <View style={[createPostStyles.selectedSongContainer, { backgroundColor: '#D6D3D1' }]}>
          <View style={createPostStyles.songInfoRow}>
            <IconSymbol name="music.note" size={18} color={primaryColor} />
            <View style={createPostStyles.songTextContainer}>
              <ThemedText style={createPostStyles.selectedSongName}>{selectedSong.name}</ThemedText>
              <ThemedText style={createPostStyles.selectedSongArtist}>{selectedSong.artist}</ThemedText>
            </View>
          </View>
          <TouchableOpacity onPress={onRemoveSong} style={createPostStyles.removeButton}>
            <IconSymbol name="xmark.circle.fill" size={22} color={mutedColor} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={[createPostStyles.selectSongButton, { backgroundColor: '#D6D3D1' }]} 
          onPress={onSelectSong}
        >
          <IconSymbol name="music.note" size={20} color={primaryColor} />
          <ThemedText style={[createPostStyles.selectSongText, { color: '#4B5563' }]}>
            Select a song
          </ThemedText>
        </TouchableOpacity>
      )}
      
      <View style={createPostStyles.createPostActions}>
        <ThemedText style={[createPostStyles.characterCount, { color: '#9CA3AF' }]}>
          {postContent.length}/500
        </ThemedText>
        <TouchableOpacity
          style={[
            createPostStyles.postButton,
            { backgroundColor: primaryColor },
            (!postContent.trim() || !selectedSong || isPosting) && createPostStyles.postButtonDisabled
          ]}
          onPress={onCreatePost}
          disabled={!postContent.trim() || !selectedSong || isPosting}
        >
          {isPosting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <ThemedText style={createPostStyles.postButtonText}>Post</ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

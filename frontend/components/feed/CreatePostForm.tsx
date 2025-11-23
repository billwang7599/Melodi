import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";
import { createPostStyles } from "@/styles/createPostStyles";
import { SelectedSong } from "@/types/feed";
import {
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
  textColor: string;
  borderColor: string;
  accentColor: string;
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
  textColor,
  borderColor,
  accentColor,
}: CreatePostFormProps) {
  const shadowColor = useThemeColor({}, 'shadow');

  return (
    <View
      style={[
        createPostStyles.createPostContainer,
        { backgroundColor: surfaceColor, shadowColor },
      ]}
    >
      {selectedSong ? (
        <View style={[createPostStyles.selectedSongContainer, { backgroundColor: accentColor }]}>
          <View style={createPostStyles.songInfoRow}>
            <IconSymbol name="music.note" size={18} color={primaryColor} />
            <View style={createPostStyles.songTextContainer}>
              <ThemedText style={createPostStyles.selectedSongName}>
                {selectedSong.name}
              </ThemedText>
              <ThemedText style={[createPostStyles.selectedSongArtist, { color: mutedColor }]}>
                {selectedSong.artist}
              </ThemedText>
            </View>
          </View>
          <TouchableOpacity
            onPress={onRemoveSong}
            style={createPostStyles.removeButton}
          >
            <IconSymbol name="xmark.circle.fill" size={22} color={mutedColor} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            createPostStyles.selectSongButton,
            { backgroundColor: accentColor },
          ]}
          onPress={onSelectSong}
        >
          <IconSymbol name="music.note" size={20} color={textColor} />
          <ThemedText
            style={[createPostStyles.selectSongText, { color: textColor }]}
          >
            Select a song
          </ThemedText>
        </TouchableOpacity>
      )}

      <TextInput
        style={[
          createPostStyles.postInput,
          { color: textColor, borderColor: borderColor },
        ]}
        placeholder="What's on your mind?"
        placeholderTextColor={mutedColor}
        value={postContent}
        onChangeText={setPostContent}
        multiline
        maxLength={500}
      />

      <View style={createPostStyles.createPostActions}>
        <ThemedText
          style={[createPostStyles.characterCount, { color: mutedColor }]}
        >
          {postContent.length}/500
        </ThemedText>
        <TouchableOpacity
          style={[
            createPostStyles.postButton,
            { backgroundColor: primaryColor },
            (!postContent.trim() || !selectedSong || isPosting) &&
              createPostStyles.postButtonDisabled,
          ]}
          onPress={onCreatePost}
          disabled={!postContent.trim() || !selectedSong || isPosting}
        >
          {isPosting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <ThemedText style={createPostStyles.postButtonText}>
              Post
            </ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

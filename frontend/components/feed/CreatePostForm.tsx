import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";
import { createPostStyles } from "@/styles/createPostStyles";
import { SelectedAlbum, SelectedSong } from "@/types/feed";
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
  selectedAlbum: SelectedAlbum | null;
  onSelectSong: () => void;
  onSelectAlbum: () => void;
  onRemoveSong: () => void;
  onRemoveAlbum: () => void;
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
  selectedAlbum,
  onSelectSong,
  onSelectAlbum,
  onRemoveSong,
  onRemoveAlbum,
  onCreatePost,
  isPosting,
  mutedColor,
  primaryColor,
  surfaceColor,
  textColor,
  borderColor,
  accentColor,
}: CreatePostFormProps) {
  const shadowColor = useThemeColor({}, "shadow");

  return (
    <View
      style={[
        createPostStyles.createPostContainer,
        { backgroundColor: surfaceColor, shadowColor },
      ]}
    >
      {selectedSong ? (
        <View
          style={[
            createPostStyles.selectedSongContainer,
            { backgroundColor: accentColor },
          ]}
        >
          <View style={createPostStyles.songInfoRow}>
            <IconSymbol name="music.note" size={18} color={primaryColor} />
            <View style={createPostStyles.songTextContainer}>
              <ThemedText style={createPostStyles.selectedSongName}>
                {selectedSong.name}
              </ThemedText>
              <ThemedText
                style={[
                  createPostStyles.selectedSongArtist,
                  { color: mutedColor },
                ]}
              >
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
      ) : selectedAlbum ? (
        <View
          style={[
            createPostStyles.selectedSongContainer,
            { backgroundColor: accentColor },
          ]}
        >
          <View style={createPostStyles.songInfoRow}>
            <IconSymbol name="square.stack" size={18} color={primaryColor} />
            <View style={createPostStyles.songTextContainer}>
              <ThemedText style={createPostStyles.selectedSongName}>
                {selectedAlbum.name}
              </ThemedText>
              <ThemedText
                style={[
                  createPostStyles.selectedSongArtist,
                  { color: mutedColor },
                ]}
              >
                {selectedAlbum.artist} • {selectedAlbum.rankedSongs.length} songs ranked
              </ThemedText>
            </View>
          </View>
          <TouchableOpacity
            onPress={onRemoveAlbum}
            style={createPostStyles.removeButton}
          >
            <IconSymbol name="xmark.circle.fill" size={22} color={mutedColor} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
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
          <TouchableOpacity
            style={[
              createPostStyles.selectSongButton,
              { backgroundColor: accentColor },
            ]}
            onPress={onSelectAlbum}
          >
            <IconSymbol name="square.stack" size={20} color={textColor} />
            <ThemedText
              style={[createPostStyles.selectSongText, { color: textColor }]}
            >
              Rank an album
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      <TextInput
        style={[
          createPostStyles.postInput,
          { color: textColor, borderColor: borderColor },
        ]}
        placeholder="What's on your mind?"
        placeholderTextColor={mutedColor + "80"}
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
            ((!selectedSong && !selectedAlbum) || isPosting) && createPostStyles.postButtonDisabled,
          ]}
          onPress={onCreatePost}
          disabled={(!selectedSong && !selectedAlbum) || isPosting}
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

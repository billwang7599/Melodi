import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { searchModalStyles } from '@/styles/searchModalStyles';
import { SpotifyTrack } from '@/types/feed';
import { Image } from 'expo-image';
import { ActivityIndicator, Modal, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';

interface SongSearchModalProps {
  visible: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SpotifyTrack[];
  isSearching: boolean;
  onSongSelect: (track: SpotifyTrack) => void;
  onClose: () => void;
  mutedColor: string;
  primaryColor: string;
  insets: { top: number };
}

export function SongSearchModal({
  visible,
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearching,
  onSongSelect,
  onClose,
  mutedColor,
  primaryColor,
  insets,
}: SongSearchModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[searchModalStyles.modalContainer, { paddingTop: insets.top }]}>
        <View style={searchModalStyles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={searchModalStyles.modalCloseButton}>
            <IconSymbol name="xmark" size={20} color={mutedColor} />
          </TouchableOpacity>
          <ThemedText style={searchModalStyles.modalTitle}>Search for a song</ThemedText>
          <View style={searchModalStyles.modalSpacer} />
        </View>

        <View style={searchModalStyles.searchContainer}>
          <TextInput
            style={[searchModalStyles.searchInput, { color: mutedColor }]}
            placeholder="Search songs..."
            placeholderTextColor={mutedColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {isSearching && (
            <ActivityIndicator size="small" color={primaryColor} style={searchModalStyles.searchLoader} />
          )}
        </View>

        <ScrollView style={searchModalStyles.searchResultsContainer}>
          {searchResults.length > 0 ? (
            searchResults.map((track) => (
              <TouchableOpacity
                key={track.id}
                style={searchModalStyles.searchResultItem}
                onPress={() => onSongSelect(track)}
              >
                <Image
                  source={{ 
                    uri: track.album.images[0]?.url || 'https://via.placeholder.com/50' 
                  }}
                  style={searchModalStyles.searchResultImage}
                />
                <View style={searchModalStyles.searchResultInfo}>
                  <ThemedText style={searchModalStyles.searchResultTitle}>{track.name}</ThemedText>
                  <ThemedText style={searchModalStyles.searchResultArtist}>
                    {track.artists.map(artist => artist.name).join(', ')}
                  </ThemedText>
                  <ThemedText style={searchModalStyles.searchResultAlbum}>{track.album.name}</ThemedText>
                </View>
                <IconSymbol name="chevron.right" size={16} color={mutedColor} />
              </TouchableOpacity>
            ))
          ) : searchQuery.trim() && !isSearching ? (
            <View style={searchModalStyles.noResultsContainer}>
              <IconSymbol name="music.note" size={32} color={mutedColor} style={searchModalStyles.noResultsIcon} />
              <ThemedText style={searchModalStyles.noResultsText}>No songs found</ThemedText>
              <ThemedText style={searchModalStyles.noResultsSubtext}>Try a different search term</ThemedText>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

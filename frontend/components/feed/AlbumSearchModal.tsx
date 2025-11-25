import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { searchModalStyles } from '@/styles/searchModalStyles';
import { Image } from 'expo-image';
import { ActivityIndicator, Modal, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';

export interface SpotifyAlbumSearchResult {
  id: string;
  name: string;
  artists: {
    id: string;
    name: string;
  }[];
  images: {
    url: string;
    height: number;
    width: number;
  }[];
  release_date: string;
  total_tracks: number;
}

interface AlbumSearchModalProps {
  visible: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SpotifyAlbumSearchResult[];
  isSearching: boolean;
  onAlbumSelect: (album: SpotifyAlbumSearchResult) => void;
  onClose: () => void;
  mutedColor: string;
  primaryColor: string;
  insets: { top: number };
}

export function AlbumSearchModal({
  visible,
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearching,
  onAlbumSelect,
  onClose,
  mutedColor,
  primaryColor,
  insets,
}: AlbumSearchModalProps) {
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
          <ThemedText style={searchModalStyles.modalTitle}>Search for an album</ThemedText>
          <View style={searchModalStyles.modalSpacer} />
        </View>

        <View style={searchModalStyles.searchContainer}>
          <TextInput
            style={[searchModalStyles.searchInput, { color: mutedColor }]}
            placeholder="Search albums..."
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
            searchResults.map((album) => (
              <TouchableOpacity
                key={album.id}
                style={searchModalStyles.searchResultItem}
                onPress={() => onAlbumSelect(album)}
              >
                <Image
                  source={{ 
                    uri: album.images[0]?.url || 'https://via.placeholder.com/50' 
                  }}
                  style={searchModalStyles.searchResultImage}
                />
                <View style={searchModalStyles.searchResultInfo}>
                  <ThemedText style={searchModalStyles.searchResultTitle}>{album.name}</ThemedText>
                  <ThemedText style={searchModalStyles.searchResultArtist}>
                    {album.artists.map(artist => artist.name).join(', ')}
                  </ThemedText>
                  <ThemedText style={searchModalStyles.searchResultAlbum}>
                    {album.total_tracks} tracks • {album.release_date?.split('-')[0] || 'Unknown year'}
                  </ThemedText>
                </View>
                <IconSymbol name="chevron.right" size={16} color={mutedColor} />
              </TouchableOpacity>
            ))
          ) : searchQuery.trim() && !isSearching ? (
            <View style={searchModalStyles.noResultsContainer}>
              <IconSymbol name="music.note" size={32} color={mutedColor} style={searchModalStyles.noResultsIcon} />
              <ThemedText style={searchModalStyles.noResultsText}>No albums found</ThemedText>
              <ThemedText style={searchModalStyles.noResultsSubtext}>Try a different search term</ThemedText>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}


import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { RankedSong, SpotifyAlbum } from '@/types/feed';
import { Image } from 'expo-image';
import { useState, useEffect } from 'react';
import { ActivityIndicator, Modal, ScrollView, TouchableOpacity, View, Alert } from 'react-native';
import { StyleSheet } from 'react-native';

interface AlbumRankingModalProps {
  visible: boolean;
  album: SpotifyAlbum | null;
  isLoading: boolean;
  onConfirm: (rankedSongs: RankedSong[]) => void;
  onClose: () => void;
  mutedColor: string;
  primaryColor: string;
  textColor: string;
  surfaceColor: string;
  borderColor: string;
  insets: { top: number };
}

const rankingStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    minHeight: 44,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  modalSpacer: {
    width: 44,
  },
  albumHeader: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  albumImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  albumName: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  albumArtist: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 8,
  },
  instructions: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 8,
  },
  songsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  songInfo: {
    flex: 1,
  },
  songName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  songArtist: {
    fontSize: 13,
    opacity: 0.7,
  },
  dragHandle: {
    padding: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  confirmButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
});

export function AlbumRankingModal({
  visible,
  album,
  isLoading,
  onConfirm,
  onClose,
  mutedColor,
  primaryColor,
  textColor,
  surfaceColor,
  borderColor,
  insets,
}: AlbumRankingModalProps) {
  const [rankedSongs, setRankedSongs] = useState<RankedSong[]>([]);

  useEffect(() => {
    if (album && album.tracks?.items) {
      // Initialize with all songs unranked (rank 0)
      const initialSongs: RankedSong[] = album.tracks.items.map((track) => ({
        spotifyId: track.id,
        name: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        rank: 0,
        trackNumber: track.track_number || 0,
      }));
      setRankedSongs(initialSongs);
    }
  }, [album]);

  const handleRankSong = (songId: string) => {
    setRankedSongs(prev => {
      const song = prev.find(s => s.spotifyId === songId);
      if (!song) return prev;

      const currentMaxRank = Math.max(...prev.map(s => s.rank), 0);
      const newRank = song.rank === 0 ? currentMaxRank + 1 : 0;

      return prev.map(s =>
        s.spotifyId === songId ? { ...s, rank: newRank } : s
      );
    });
  };

  const handleMoveRank = (songId: string, direction: 'up' | 'down') => {
    setRankedSongs(prev => {
      const song = prev.find(s => s.spotifyId === songId);
      if (!song || song.rank === 0) return prev;

      const targetRank = direction === 'up' ? song.rank - 1 : song.rank + 1;
      const targetSong = prev.find(s => s.rank === targetRank);
      
      if (!targetSong) return prev;

      return prev.map(s => {
        if (s.spotifyId === songId) {
          return { ...s, rank: targetRank };
        } else if (s.spotifyId === targetSong.spotifyId) {
          return { ...s, rank: song.rank };
        }
        return s;
      });
    });
  };

  const handleConfirm = () => {
    const ranked = rankedSongs.filter(s => s.rank > 0).sort((a, b) => a.rank - b.rank);
    
    if (ranked.length === 0) {
      Alert.alert('No rankings', 'Please rank at least one song from the album.');
      return;
    }

    onConfirm(ranked);
  };

  const sortedSongs = [...rankedSongs].sort((a, b) => {
    if (a.rank === 0 && b.rank === 0) return a.trackNumber - b.trackNumber;
    if (a.rank === 0) return 1;
    if (b.rank === 0) return -1;
    return a.rank - b.rank;
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[rankingStyles.modalContainer, { paddingTop: insets.top, backgroundColor: surfaceColor }]}>
        <View style={rankingStyles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={rankingStyles.modalCloseButton}>
            <IconSymbol name="xmark" size={20} color={mutedColor} />
          </TouchableOpacity>
          <ThemedText style={rankingStyles.modalTitle}>Rank Album Songs</ThemedText>
          <View style={rankingStyles.modalSpacer} />
        </View>

        {isLoading ? (
          <View style={rankingStyles.loadingContainer}>
            <ActivityIndicator size="large" color={primaryColor} />
            <ThemedText style={{ marginTop: 16, color: mutedColor }}>Loading album...</ThemedText>
          </View>
        ) : album ? (
          <>
            <View style={rankingStyles.albumHeader}>
              <Image
                source={{ uri: album.images[0]?.url || 'https://via.placeholder.com/150' }}
                style={rankingStyles.albumImage}
              />
              <ThemedText style={rankingStyles.albumName}>{album.name}</ThemedText>
              <ThemedText style={[rankingStyles.albumArtist, { color: mutedColor }]}>
                {album.artists.map(a => a.name).join(', ')}
              </ThemedText>
              <ThemedText style={[rankingStyles.instructions, { color: mutedColor }]}>
                Tap songs to rank them. Tap again to unrank.
              </ThemedText>
            </View>

            <ScrollView style={rankingStyles.songsList}>
              {sortedSongs.map((song) => (
                <TouchableOpacity
                  key={song.spotifyId}
                  style={[
                    rankingStyles.songItem,
                    {
                      backgroundColor: song.rank > 0 ? primaryColor + '20' : surfaceColor,
                      borderColor: song.rank > 0 ? primaryColor : borderColor,
                    },
                  ]}
                  onPress={() => handleRankSong(song.spotifyId)}
                >
                  {song.rank > 0 ? (
                    <View style={[rankingStyles.rankBadge, { backgroundColor: primaryColor }]}>
                      <ThemedText style={rankingStyles.rankText}>{song.rank}</ThemedText>
                    </View>
                  ) : (
                    <View style={[rankingStyles.rankBadge, { backgroundColor: mutedColor + '40' }]}>
                      <IconSymbol name="circle" size={16} color={mutedColor} />
                    </View>
                  )}
                  <View style={rankingStyles.songInfo}>
                    <ThemedText style={[rankingStyles.songName, { color: textColor }]}>
                      {song.name}
                    </ThemedText>
                    <ThemedText style={[rankingStyles.songArtist, { color: mutedColor }]}>
                      {song.artist}
                    </ThemedText>
                  </View>
                  {song.rank > 0 && (
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      {song.rank > 1 && (
                        <TouchableOpacity
                          style={rankingStyles.dragHandle}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleMoveRank(song.spotifyId, 'up');
                          }}
                        >
                          <IconSymbol name="chevron.up" size={18} color={primaryColor} />
                        </TouchableOpacity>
                      )}
                      {song.rank < Math.max(...rankedSongs.map(s => s.rank), 0) && (
                        <TouchableOpacity
                          style={rankingStyles.dragHandle}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleMoveRank(song.spotifyId, 'down');
                          }}
                        >
                          <IconSymbol name="chevron.down" size={18} color={primaryColor} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={[rankingStyles.footer, { borderTopColor: borderColor }]}>
              <TouchableOpacity
                style={[rankingStyles.confirmButton, { backgroundColor: primaryColor }]}
                onPress={handleConfirm}
              >
                <ThemedText style={rankingStyles.confirmButtonText}>
                  Confirm Ranking ({rankedSongs.filter(s => s.rank > 0).length} songs ranked)
                </ThemedText>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </View>
    </Modal>
  );
}


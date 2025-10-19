import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { feedStyles } from '@/styles/feedStyles';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';

interface FeedStateProps {
  loading: boolean;
  error: string | null;
  feedDataLength: number;
  onRetry: () => void;
  primaryColor: string;
  mutedColor: string;
}

export function FeedState({ 
  loading, 
  error, 
  feedDataLength, 
  onRetry, 
  primaryColor, 
  mutedColor 
}: FeedStateProps) {
  if (loading) {
    return (
      <View style={feedStyles.loadingState}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText style={feedStyles.loadingText}>Loading posts...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={feedStyles.errorState}>
        <IconSymbol 
          name="exclamationmark.triangle" 
          size={48} 
          color={mutedColor} 
          style={feedStyles.errorIcon}
        />
        <ThemedText style={feedStyles.errorTitle}>Failed to load posts</ThemedText>
        <ThemedText style={feedStyles.errorText}>{error}</ThemedText>
        <TouchableOpacity 
          style={feedStyles.retryButton}
          onPress={onRetry}
        >
          <ThemedText style={feedStyles.retryButtonText}>Try Again</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  if (feedDataLength === 0) {
    return (
      <View style={feedStyles.emptyState}>
        <IconSymbol 
          name="music.note.list" 
          size={48} 
          color={mutedColor} 
          style={feedStyles.emptyStateIcon}
        />
        <ThemedText style={feedStyles.emptyStateTitle}>No posts yet</ThemedText>
        <ThemedText style={feedStyles.emptyStateText}>
          When your friends start sharing music, their posts will appear here.
        </ThemedText>
      </View>
    );
  }

  return null;
}

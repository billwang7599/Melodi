import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Comment } from '@/types/feed';
import { StyleSheet, View } from 'react-native';

interface CommentsListProps {
  comments: Comment[];
  mutedColor: string;
}

export function CommentsList({ comments, mutedColor }: CommentsListProps) {
  if (!comments || comments.length === 0) {
    return null;
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  return (
    <View style={styles.commentsContainer}>
      {comments.map((comment) => (
        <View key={comment.id} style={styles.commentItem}>
          <View style={styles.commentHeader}>
            <IconSymbol name="person.circle.fill" size={24} color={mutedColor} />
            <View style={styles.commentContent}>
              <View style={styles.commentMeta}>
                <ThemedText style={styles.commentUsername}>
                  @{comment.users.username}
                </ThemedText>
                <ThemedText style={[styles.commentTime, { color: mutedColor }]}>
                  {formatTimestamp(comment.created_at)}
                </ThemedText>
              </View>
              <ThemedText style={styles.commentBody}>{comment.body}</ThemedText>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  commentsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  commentItem: {
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    gap: 8,
  },
  commentContent: {
    flex: 1,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 12,
  },
  commentBody: {
    fontSize: 14,
    lineHeight: 20,
  },
});

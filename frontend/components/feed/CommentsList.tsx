import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Comment } from "@/types/feed";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface CommentsListProps {
  comments: Comment[];
  mutedColor: string;
}

export function CommentsList({ comments, mutedColor }: CommentsListProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [maxVisibleComments] = useState(2);

  if (!comments || comments.length === 0) {
    return null;
  }

  const formatTimestamp = (timestamp: string): string => {
    // Replace this with your actual timestamp formatting logic
    return new Date(timestamp).toLocaleString();
  };

  const visibleComments = isCollapsed
    ? comments.slice(0, maxVisibleComments)
    : comments;
  const hasMoreComments = comments.length > maxVisibleComments;

  return (
    <View style={styles.commentsContainer}>
      {visibleComments.map((comment) => (
        <View key={comment.id} style={styles.commentItem}>
          <View style={styles.commentHeader}>
            <IconSymbol
              name="circle.fill"
              size={24}
              color={mutedColor}
            />
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

      {hasMoreComments && (
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setIsCollapsed(!isCollapsed)}
        >
          <ThemedText style={[styles.toggleText, { color: mutedColor }]}>
            {isCollapsed ? `View all ${comments.length} comments` : "Show less"}
          </ThemedText>
          <IconSymbol
            name={isCollapsed ? "chevron.down" : "chevron.up"}
            size={16}
            color={mutedColor}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  commentsContainer: {
    marginTop: 6,
  },
  commentItem: {
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: "row",
    gap: 8,
  },
  commentContent: {
    flex: 1,
  },
  commentMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: "600",
  },
  commentTime: {
    fontSize: 12,
  },
  commentBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 4,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

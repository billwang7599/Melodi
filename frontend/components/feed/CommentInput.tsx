import { IconSymbol } from '@/components/ui/icon-symbol';
import { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface CommentInputProps {
  onSubmit: (body: string) => Promise<void>;
  mutedColor: string;
  primaryColor: string;
  surfaceColor: string;
}

export function CommentInput({ 
  onSubmit, 
  mutedColor, 
  primaryColor,
  surfaceColor 
}: CommentInputProps) {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!commentText.trim() || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(commentText.trim());
      setCommentText(''); // Clear input on success
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: surfaceColor }]}>
      <View style={styles.inputContainer}>
        <IconSymbol name="person.circle.fill" size={32} color={mutedColor} />
        <TextInput
          style={[styles.input, { color: '#000' }]}
          placeholder="Write a comment..."
          placeholderTextColor={mutedColor}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
          editable={!isSubmitting}
        />
      </View>
      <TouchableOpacity
        style={[
          styles.submitButton,
          { 
            backgroundColor: commentText.trim() ? primaryColor : mutedColor,
            opacity: isSubmitting ? 0.6 : 1
          }
        ]}
        onPress={handleSubmit}
        disabled={!commentText.trim() || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <IconSymbol name="paperplane.fill" size={18} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 100,
    paddingTop: 6,
  },
  submitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

interface ProfileHeaderProps {
  displayName: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
}

export function ProfileHeader({ displayName, username, bio, avatarUrl }: ProfileHeaderProps) {
  const primaryColor = useThemeColor({}, 'primary');
  const mutedColor = useThemeColor({}, 'textMuted');

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { borderColor: primaryColor }]}>
          {avatarUrl ? (
            <IconSymbol name="person.fill" size={40} color={primaryColor} />
          ) : (
            <IconSymbol name="person.fill" size={40} color={primaryColor} />
          )}
        </View>
      </View>
      
      <ThemedText style={styles.displayName}>{displayName}</ThemedText>
      
      {username && (
        <ThemedText style={[styles.username, { color: mutedColor }]}>
          @{username}
        </ThemedText>
      )}

      {bio && (
        <ThemedText style={[styles.bio, { color: mutedColor }]}>
          {bio}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    paddingHorizontal: 20,
  },
});


import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface ProfileStatsProps {
  posts: number;
  followers: number;
  following: number;
}

export function ProfileStats({ posts, followers, following }: ProfileStatsProps) {
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'textMuted');

  return (
    <View style={styles.container}>
      <View style={styles.statItem}>
        <ThemedText style={styles.statValue}>{posts}</ThemedText>
        <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Posts</ThemedText>
      </View>
      <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
      <View style={styles.statItem}>
        <ThemedText style={styles.statValue}>{followers}</ThemedText>
        <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Followers</ThemedText>
      </View>
      <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
      <View style={styles.statItem}>
        <ThemedText style={styles.statValue}>{following}</ThemedText>
        <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Following</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
});


import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

interface ListeningStatsCardProps {
  totalMinutes: number;
  topGenre: string;
  danceability: number;
  energy: number;
}

export function ListeningStatsCard({
  totalMinutes,
  topGenre,
  danceability,
  energy,
}: ListeningStatsCardProps) {
  const primaryColor = useThemeColor({}, 'primary');
  const mutedColor = useThemeColor({}, 'textMuted');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Listening Stats</ThemedText>
      <View style={[styles.card, { backgroundColor: surfaceColor, borderColor }]}>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <IconSymbol name="clock.fill" size={24} color={primaryColor} />
            <ThemedText style={styles.statValue}>
              {Math.round(totalMinutes / 60)}h
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: mutedColor }]}>
              Total Listened
            </ThemedText>
          </View>
          
          <View style={styles.statItem}>
            <IconSymbol name="music.note" size={24} color={primaryColor} />
            <ThemedText style={styles.statValue}>{topGenre}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: mutedColor }]}>
              Top Genre
            </ThemedText>
          </View>

          <View style={styles.statItem}>
            <IconSymbol name="figure.dance" size={24} color={primaryColor} />
            <ThemedText style={styles.statValue}>{danceability}%</ThemedText>
            <ThemedText style={[styles.statLabel, { color: mutedColor }]}>
              Danceability
            </ThemedText>
          </View>

          <View style={styles.statItem}>
            <IconSymbol name="bolt.fill" size={24} color={primaryColor} />
            <ThemedText style={styles.statValue}>{energy}%</ThemedText>
            <ThemedText style={[styles.statLabel, { color: mutedColor }]}>
              Energy
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});


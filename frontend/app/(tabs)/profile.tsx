import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';


interface ProfileStats {
  totalPosts: number;
  totalFollowers: number;
  totalFollowing: number;
}


interface ListeningStats {
  totalMinutes: number;
  topGenre: string;
  danceability: number;
  energy: number;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const primaryColor = useThemeColor({}, 'primary');
  const mutedColor = useThemeColor({}, 'textMuted');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    totalPosts: 0,
    totalFollowers: 0,
    totalFollowing: 0,
  });
  const [listeningStats, setListeningStats] = useState<ListeningStats | null>(null);


  // Load profile data function
  const loadProfileData = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    setLoading(true);
    try {
      // Fetch real profile stats from backend
      const response = await fetch(`${API.BACKEND_URL}/api/auth/user/${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.user?.stats) {
        setProfileStats({
          totalPosts: result.user.stats.totalPosts || 0,
          totalFollowers: result.user.stats.totalFollowers || 0,
          totalFollowing: result.user.stats.totalFollowing || 0,
        });
      }

      // Mock listening stats for now (TODO: Replace with real API when available)
      setListeningStats({
        totalMinutes: 12456,
        topGenre: 'Pop',
        danceability: 72,
        energy: 68,
      });

    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load profile data when page comes into focus (refreshes stats)
  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [loadProfileData])
  );


  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };


  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={styles.loadingText}>Loading your profile...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 30 }]}>
          <ThemedText style={styles.headerTitle}>Profile</ThemedText>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => router.push('/profile/edit' as any)}
            >
              <IconSymbol name="gear" size={20} color={mutedColor} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleLogout}
            >
              <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={mutedColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Info */}
        <View style={[styles.profileCard, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { borderColor: primaryColor }]}>
              <IconSymbol name="person.fill" size={40} color={primaryColor} />
            </View>
          </View>
          
          <ThemedText style={styles.displayName}>
            {user?.user_metadata?.username || user?.email?.split('@')[0] || 'Music Lover'}
          </ThemedText>
          
          {user?.email && (
            <ThemedText style={[styles.email, { color: mutedColor }]}>
              {user.email}
            </ThemedText>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{profileStats.totalPosts}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Posts</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => user && router.push(`/followers?userId=${user.id}` as any)}
            >
              <ThemedText style={styles.statValue}>{profileStats.totalFollowers}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Followers</ThemedText>
            </TouchableOpacity>
            <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => user && router.push(`/following?userId=${user.id}` as any)}
            >
              <ThemedText style={styles.statValue}>{profileStats.totalFollowing}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Following</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity 
            style={[styles.editButton, { borderColor }]}
            onPress={() => router.push('/profile/edit' as any)}
          >
            <IconSymbol name="pencil" size={14} color={primaryColor} />
            <ThemedText style={[styles.editButtonText, { color: primaryColor }]}>
              Edit Profile
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Listening Stats */}
        {listeningStats && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Listening Stats</ThemedText>
            <View style={[styles.card, { backgroundColor: surfaceColor, borderColor }]}>
              <View style={styles.listeningStatsGrid}>
                <View style={styles.listeningStatItem}>
                  <IconSymbol name="clock.fill" size={24} color={primaryColor} />
                  <ThemedText style={styles.listeningStatValue}>
                    {Math.round(listeningStats.totalMinutes / 60)}h
                  </ThemedText>
                  <ThemedText style={[styles.listeningStatLabel, { color: mutedColor }]}>
                    Total Listened
                  </ThemedText>
                </View>
                
                <View style={styles.listeningStatItem}>
                  <IconSymbol name="music.note" size={24} color={primaryColor} />
                  <ThemedText style={styles.listeningStatValue}>
                    {listeningStats.topGenre}
                  </ThemedText>
                  <ThemedText style={[styles.listeningStatLabel, { color: mutedColor }]}>
                    Top Genre
                  </ThemedText>
                </View>

                <View style={styles.listeningStatItem}>
                  <IconSymbol name="figure.dance" size={24} color={primaryColor} />
                  <ThemedText style={styles.listeningStatValue}>
                    {listeningStats.danceability}%
                  </ThemedText>
                  <ThemedText style={[styles.listeningStatLabel, { color: mutedColor }]}>
                    Danceability
                  </ThemedText>
                </View>

                <View style={styles.listeningStatItem}>
                  <IconSymbol name="bolt.fill" size={24} color={primaryColor} />
                  <ThemedText style={styles.listeningStatValue}>
                    {listeningStats.energy}%
                  </ThemedText>
                  <ThemedText style={[styles.listeningStatLabel, { color: mutedColor }]}>
                    Energy
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        )}


        <View style={styles.bottomPadding} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 34,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  profileCard: {
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
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
  email: {
    fontSize: 14,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  listeningStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  listeningStatItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
  },
  listeningStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  listeningStatLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});


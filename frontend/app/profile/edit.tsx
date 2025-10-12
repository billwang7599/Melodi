import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function EditProfileScreen() {
  const { user } = useAuth();
  const primaryColor = useThemeColor({}, 'primary');
  const mutedColor = useThemeColor({}, 'textMuted');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');

  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.username || user?.email?.split('@')[0] || ''
  );
  const [bio, setBio] = useState(user?.user_metadata?.bio || '');
  const [favoriteGenres, setFavoriteGenres] = useState(
    user?.user_metadata?.favorite_genres || ''
  );
  const [isPublicProfile, setIsPublicProfile] = useState(
    user?.user_metadata?.is_public_profile ?? true
  );
  const [showTopTracks, setShowTopTracks] = useState(
    user?.user_metadata?.show_top_tracks ?? true
  );
  const [showTopArtists, setShowTopArtists] = useState(
    user?.user_metadata?.show_top_artists ?? true
  );
  const [showListeningStats, setShowListeningStats] = useState(
    user?.user_metadata?.show_listening_stats ?? true
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty');
      return;
    }

    try {
      setIsSaving(true);
      
      // TODO: api call to update user profile
      
      console.log('Saving profile with data:', {
        displayName,
        bio,
        favoriteGenres,
        isPublicProfile,
        showTopTracks,
        showTopArtists,
        showListeningStats,
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <IconSymbol name="chevron.left" size={24} color={mutedColor} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Edit Profile</ThemedText>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={styles.headerButton}
          >
            <ThemedText
              style={[
                styles.saveText,
                { color: primaryColor },
                isSaving && styles.saveTextDisabled,
              ]}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile Picture */}
          <View style={styles.section}>
            <View style={styles.avatarSection}>
              <View style={[styles.avatar, { borderColor: primaryColor }]}>
                <IconSymbol name="person.fill" size={48} color={primaryColor} />
              </View>
              <TouchableOpacity style={styles.changePhotoButton}>
                <ThemedText style={[styles.changePhotoText, { color: primaryColor }]}>
                  Change Photo
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: mutedColor }]}>
                Display Name
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: surfaceColor,
                    borderColor,
                    color: primaryColor,
                  },
                ]}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your display name"
                placeholderTextColor={mutedColor}
                maxLength={50}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: mutedColor }]}>
                Bio
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: surfaceColor,
                    borderColor,
                    color: primaryColor,
                  },
                ]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about your music taste..."
                placeholderTextColor={mutedColor}
                multiline
                numberOfLines={4}
                maxLength={200}
              />
              <ThemedText style={[styles.characterCount, { color: mutedColor }]}>
                {bio.length}/200
              </ThemedText>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: mutedColor }]}>
                Favorite Genres
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: surfaceColor,
                    borderColor,
                    color: primaryColor,
                  },
                ]}
                value={favoriteGenres}
                onChangeText={setFavoriteGenres}
                placeholder="e.g., Pop, Hip-Hop, Rock"
                placeholderTextColor={mutedColor}
                maxLength={100}
              />
            </View>
          </View>

          {/* Privacy Settings */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Privacy Settings</ThemedText>

            <View style={[styles.settingRow, { borderBottomColor: borderColor }]}>
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingLabel}>Public Profile</ThemedText>
                <ThemedText style={[styles.settingDescription, { color: mutedColor }]}>
                  Allow others to view your profile
                </ThemedText>
              </View>
              <Switch
                value={isPublicProfile}
                onValueChange={setIsPublicProfile}
                trackColor={{ false: borderColor, true: primaryColor }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Display Preferences */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>What to Show on Profile</ThemedText>

            <View style={[styles.settingRow, { borderBottomColor: borderColor }]}>
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingLabel}>Top Tracks</ThemedText>
                <ThemedText style={[styles.settingDescription, { color: mutedColor }]}>
                  Display your most played songs
                </ThemedText>
              </View>
              <Switch
                value={showTopTracks}
                onValueChange={setShowTopTracks}
                trackColor={{ false: borderColor, true: primaryColor }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.settingRow, { borderBottomColor: borderColor }]}>
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingLabel}>Top Artists</ThemedText>
                <ThemedText style={[styles.settingDescription, { color: mutedColor }]}>
                  Display your favorite artists
                </ThemedText>
              </View>
              <Switch
                value={showTopArtists}
                onValueChange={setShowTopArtists}
                trackColor={{ false: borderColor, true: primaryColor }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingLabel}>Listening Stats</ThemedText>
                <ThemedText style={[styles.settingDescription, { color: mutedColor }]}>
                  Show analytics about your taste
                </ThemedText>
              </View>
              <Switch
                value={showListeningStats}
                onValueChange={setShowListeningStats}
                trackColor={{ false: borderColor, true: primaryColor }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Delete Account */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.deleteButton, { borderColor: '#FF6B6B' }]}
              onPress={() => {
                Alert.alert(
                  'Delete Account',
                  'Are you sure you want to delete your account? This action cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => {
                        // TODO: // account deletion API
                        console.log('Delete account');
                      },
                    },
                  ]
                );
              }}
            >
              <IconSymbol name="trash" size={16} color="#FF6B6B" />
              <ThemedText style={styles.deleteButtonText}>Delete Account</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerButton: {
    padding: 4,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 12,
  },
  changePhotoButton: {
    padding: 8,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  bottomPadding: {
    height: 40,
  },
});


import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

import { ThemeToggle } from '@/components/theme-toggle';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function EditProfileScreen() {
  const { user } = useAuth();
  const primaryColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');

  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteGenres, setFavoriteGenres] = useState('');
  const [isPublicProfile, setIsPublicProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
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
        const profile = result.user;
        
        setDisplayName(profile.display_name || profile.username || '');
        setBio(profile.bio || '');
        setFavoriteGenres(profile.favorite_genres || '');
        setIsPublicProfile(profile.is_public ?? true);
      } catch (error) {
        console.error('Error loading user profile:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [user?.id]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setIsSaving(true);
      
      // Update user profile via backend API
      const response = await fetch(`${API.BACKEND_URL}/api/auth/user/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
          bio: bio.trim(),
          favoriteGenres: favoriteGenres.trim(),
          isPublic: isPublicProfile,
        }),
      });

      if (!response.ok) {
        console.log(API.BACKEND_URL)
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Profile updated:', result);

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

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
        </View>
      </ThemedView>
    );
  }

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
                <IconSymbol name="circle.fill" size={48} color={primaryColor} />
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
                    color: textColor,
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
                    color: textColor,
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
                    color: textColor,
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

          {/* Appearance */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Appearance</ThemedText>
            <ThemeToggle />
          </View>

          {/* Privacy Settings */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Privacy Settings</ThemedText>

            <View style={styles.settingRow}>
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


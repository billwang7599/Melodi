import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, TouchableOpacity } from 'react-native';

interface LogoutButtonProps {
  style?: any;
  textStyle?: any;
  buttonText?: string;
  confirmTitle?: string;
  confirmMessage?: string;
  showUserEmail?: boolean;
  onLogoutStart?: () => void;
  onLogoutComplete?: () => void;
  onLogoutError?: (error: any) => void;
}

export function LogoutButton({
  style,
  textStyle,
  buttonText,
  confirmTitle = "Logout",
  confirmMessage = "Are you sure you want to logout?",
  showUserEmail = true,
  onLogoutStart,
  onLogoutComplete,
  onLogoutError,
}: LogoutButtonProps) {
  const { user, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const getUserDisplayText = () => {
    if (buttonText) return buttonText;
    
    if (loggingOut) return "Logging out...";
    
    if (showUserEmail) {
      const email = user?.email || user?.user_metadata?.email;
      return email ? `Logout (${email})` : "Logout";
    }
    
    return "Logout";
  };

  const handleLogout = () => {
    Alert.alert(
      confirmTitle,
      confirmMessage,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive", 
          onPress: async () => {
            setLoggingOut(true);
            onLogoutStart?.();
            
            try {
              await signOut();
              onLogoutComplete?.();
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert("Error", "Failed to logout. Please try again.");
              onLogoutError?.(error);
            } finally {
              setLoggingOut(false);
            }
          }
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[
        style,
        loggingOut && { opacity: 0.6 }
      ]}
      disabled={loggingOut}
      onPress={handleLogout}
    >
      {loggingOut ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <ThemedText style={textStyle}>
          {getUserDisplayText()}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
}

// Default export for easier importing
export default LogoutButton;
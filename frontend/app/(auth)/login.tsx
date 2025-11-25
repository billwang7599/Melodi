import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import { validateEmail } from "@/lib/auth";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, TextInput, TouchableOpacity } from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const { signIn, signInWithSpotify } = useAuth();

  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const dangerColor = useThemeColor({}, 'danger');
  const primaryColor = useThemeColor({}, 'primary');
  const mutedColor = useThemeColor({}, 'textMuted');
  const surfaceColor = useThemeColor({}, 'surface');

  const clearError = (field: string) => {
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateInput = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    // Email validation
    if (!validateEmail(email)) {
      newErrors.email = "Email must be in the format: example@domain.com";
      isValid = false;
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignIn = async () => {
    if (!validateInput()) {
      return;
    }

    setLoading(true);
    try {
      const result = await signIn(email, password);

      if (result.success) {
        router.replace("/(tabs)/feed");
      } else {
        Alert.alert("Error", result.error || "Invalid credentials");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSpotifySignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithSpotify();

      if (!result.success) {
        Alert.alert("Error", result.error || "Failed to sign in with Spotify");
      }
      // Success will be handled by the auth state change listener
    } catch (error) {
      Alert.alert("Error", "Something went wrong with Spotify sign-in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Welcome Back
      </ThemedText>
      <TextInput
        style={[styles.input, { borderColor: errors.email ? dangerColor : borderColor, color: textColor }]}
        placeholder="Email"
        placeholderTextColor={mutedColor}
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          clearError("email");
        }}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {errors.email ? (
        <ThemedText style={[styles.errorText, { color: dangerColor }]}>{errors.email}</ThemedText>
      ) : null}
      <TextInput
        style={[styles.input, { borderColor: errors.password ? dangerColor : borderColor, color: textColor }]}
        placeholder="Password"
        placeholderTextColor={mutedColor}
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          clearError("password");
        }}
        secureTextEntry
      />
      {errors.password ? (
        <ThemedText style={[styles.errorText, { color: dangerColor }]}>{errors.password}</ThemedText>
      ) : null}
      <TouchableOpacity
        style={[styles.signInButton, { backgroundColor: primaryColor }, loading && styles.buttonDisabled]}
        onPress={handleSignIn}
        disabled={loading}
      >
        <ThemedText style={styles.buttonText}>
          {loading ? "Signing In..." : "Sign In"}
        </ThemedText>
      </TouchableOpacity>
      <ThemedView style={styles.orContainer}>
        <ThemedView style={[styles.orLine, { backgroundColor: borderColor }]} />
        <ThemedText style={styles.orText}>OR</ThemedText>
        <ThemedView style={[styles.orLine, { backgroundColor: borderColor }]} />
      </ThemedView>
      <TouchableOpacity
        style={[styles.spotifyButton, { backgroundColor: surfaceColor, borderColor }, loading && styles.buttonDisabled]}
        onPress={handleSpotifySignIn}
        disabled={loading}
      >
        <ThemedText style={[styles.spotifyButtonText, { color: textColor }]}>
          {loading ? "Connecting..." : "Continue with Spotify"}
        </ThemedText>
      </TouchableOpacity>
      <ThemedView style={styles.linkContainer}>
        <ThemedText style={styles.linkText}>Don't have an account? </ThemedText>
        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity>
            <ThemedText style={[styles.link, { color: primaryColor }]}>Sign Up</ThemedText>
          </TouchableOpacity>
        </Link>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    paddingBottom: 60,
  },
  title: {
    marginBottom: 24,
    textAlign: "left",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 15,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
  },
  signInButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    elevation: 3,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  linkText: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    fontWeight: "bold",
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    marginHorizontal: 15,
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  spotifyButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    elevation: 3,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  spotifyButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

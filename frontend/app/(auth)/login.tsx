import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/AuthContext";
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
        style={[styles.input, errors.email ? styles.inputError : null]}
        placeholder="Email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          clearError("email");
        }}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {errors.email ? (
        <ThemedText style={styles.errorText}>{errors.email}</ThemedText>
      ) : null}
      <TextInput
        style={[styles.input, errors.password ? styles.inputError : null]}
        placeholder="Password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          clearError("password");
        }}
        secureTextEntry
      />
      {errors.password ? (
        <ThemedText style={styles.errorText}>{errors.password}</ThemedText>
      ) : null}
      <TouchableOpacity
        style={[styles.signInButton, loading && styles.buttonDisabled]}
        onPress={handleSignIn}
        disabled={loading}
      >
        <ThemedText style={styles.buttonText}>
          {loading ? "Signing In..." : "Sign In"}
        </ThemedText>
      </TouchableOpacity>
      <ThemedView style={styles.orContainer}>
        <ThemedView style={styles.orLine} />
        <ThemedText style={styles.orText}>OR</ThemedText>
        <ThemedView style={styles.orLine} />
      </ThemedView>
      <TouchableOpacity
        style={[styles.spotifyButton, loading && styles.buttonDisabled]}
        onPress={handleSpotifySignIn}
        disabled={loading}
      >
        <ThemedText style={styles.spotifyButtonText}>
          {loading ? "Connecting..." : "Continue with Spotify"}
        </ThemedText>
      </TouchableOpacity>
      <ThemedView style={styles.linkContainer}>
        <ThemedText style={styles.linkText}>Don't have an account? </ThemedText>
        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity>
            <ThemedText style={styles.link}>Sign Up</ThemedText>
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
    borderColor: "#DFDBC3",
    borderWidth: 1,
    borderRadius: 15,
    marginBottom: 8,
    paddingHorizontal: 16,
    color: "black",
  },
  inputError: {
    borderColor: "#C86F67",
    borderWidth: 2,
  },
  errorText: {
    color: "#C86F67",
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
  },
  signInButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    elevation: 3,
    shadowColor: "#000",
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
    color: "#007AFF",
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
    backgroundColor: "#E0E0E0",
  },
  orText: {
    marginHorizontal: 15,
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  spotifyButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  spotifyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

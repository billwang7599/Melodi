import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { validateEmail, validatePassword, validateUsername } from "@/lib/auth";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, TextInput, TouchableOpacity } from "react-native";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    username: "",
    password: "",
  });

  const { signUp, signInWithSpotify } = useAuth();

  const clearError = (field: string) => {
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateInput = () => {
    const newErrors = { email: "", username: "", password: "" };
    let isValid = true;

    // Email validation
    if (!validateEmail(email)) {
      newErrors.email = "Email must be in the format: example@domain.com";
      isValid = false;
    }

    // Username validation
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      newErrors.username = usernameValidation.message || "";
      isValid = false;
    }

    // Password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message || "";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignUp = async () => {
    if (!validateInput()) {
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(email, password, username);

      if (result.success) {
        Alert.alert(
          "Success",
          "Please check your email to verify your account!",
          [
            {
              text: "OK",
              onPress: () => router.push("/"),
            },
          ]
        );
      } else {
        Alert.alert("Error", result.error || "Something went wrong");
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
        Sign Up
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
        style={[styles.input, errors.username ? styles.inputError : null]}
        placeholder="Username"
        value={username}
        onChangeText={(text) => {
          setUsername(text);
          clearError("username");
        }}
        autoCapitalize="none"
      />
      {errors.username ? (
        <ThemedText style={styles.errorText}>{errors.username}</ThemedText>
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
        style={[styles.signUpButton, loading && styles.buttonDisabled]}
        onPress={handleSignUp}
        disabled={loading}
      >
        <ThemedText style={styles.buttonText}>
          {loading ? "Signing Up..." : "Sign Up"}
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
        <ThemedText style={styles.linkText}>
          Already have an account?{" "}
        </ThemedText>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity>
            <ThemedText style={styles.link}>Sign In</ThemedText>
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
  },
  input: {
    height: 50,
    borderColor: Colors.light.border,
    borderWidth: 2,
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
  signUpButton: {
    backgroundColor: "#7996A5",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  buttonText: {
    color: Colors.light.background,
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

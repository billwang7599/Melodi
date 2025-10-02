import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { API } from "@/constants/theme";
import { useState } from "react";
import { Alert, StyleSheet, TextInput, TouchableOpacity } from "react-native";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({
    email: "",
    username: "",
    password: "",
  });

  const clearError = (field: string) => {
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateInput = () => {
    const newErrors = { email: "", username: "", password: "" };
    let isValid = true;

    // Email validation: must contain @ and then .
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      newErrors.email = "Email must be in the format: example@domain.com";
      isValid = false;
    }

    // Username validation: 3-16 characters
    if (username.length < 3 || username.length > 16) {
      newErrors.username = "Username must be between 3 and 16 characters long";
      isValid = false;
    }

    // Password validation: must be at least 8 characters and contain at least one number
    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
      isValid = false;
    } else if (!/\d/.test(password)) {
      newErrors.password =
        "Password must contain at least one numerical character";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignUp = async () => {
    if (!validateInput()) {
      return;
    }

    try {
      const response = await fetch(`${API.BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "You have successfully signed up!");
      } else {
        Alert.alert("Error", data.message || "Something went wrong");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong");
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
      <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
        <ThemedText style={styles.buttonText}>Sign Up</ThemedText>
      </TouchableOpacity>
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
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 15,
    marginBottom: 8,
    paddingHorizontal: 16,
    color: "black",
    backgroundColor: "white",
  },
  inputError: {
    borderColor: "#FF6B6B",
    borderWidth: 2,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
  },
  signUpButton: {
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
});

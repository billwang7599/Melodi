import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";

interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(
          "Fetching users from: http://172.16.177.169:3000/api/auth/users"
        );
        const response = await fetch("http://localhost:3000/api/auth/users");
        console.log("Response status:", response.status);
        const data = await response.json();
        console.log("Response data:", data);

        if (response.ok) {
          setUsers(data);
        } else {
          setError(data.message || "Failed to fetch users");
        }
      } catch (error) {
        console.log("Fetch error:", error);
        setError(
          "Network error: Make sure your backend is running on 172.16.177.169:3000"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <ParallaxScrollView
        headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
        headerImage={
          <IconSymbol
            size={310}
            color="#808080"
            name="person.3.fill"
            style={styles.headerImage}
          />
        }
      >
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Users</ThemedText>
        </ThemedView>
        <ThemedText>Loading users...</ThemedText>
      </ParallaxScrollView>
    );
  }

  if (error) {
    return (
      <ParallaxScrollView
        headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
        headerImage={
          <IconSymbol
            size={310}
            color="#808080"
            name="person.3.fill"
            style={styles.headerImage}
          />
        }
      >
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Users</ThemedText>
        </ThemedView>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <ThemedText style={styles.helpText}>
          To fix this: Start your backend server by running 'npm run dev' in the
          backend directory.
        </ThemedText>
      </ParallaxScrollView>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="person.3.fill"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Users</ThemedText>
      </ThemedView>
      {users.length === 0 ? (
        <ThemedText>No users found. Try signing up first!</ThemedText>
      ) : (
        <>
          <ThemedText style={styles.userCount}>
            Total users: {users.length}
          </ThemedText>
          {users.map((user) => (
            <ThemedView key={user.id} style={styles.userContainer}>
              <ThemedText style={styles.username}>{user.username}</ThemedText>
              <ThemedText style={styles.email}>{user.email}</ThemedText>
              <ThemedText style={styles.joinDate}>
                Joined: {new Date(user.created_at).toLocaleDateString()}
              </ThemedText>
            </ThemedView>
          ))}
        </>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userCount: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  userContainer: {
    marginBottom: 16,
    padding: 16,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  errorText: {
    color: "red",
    marginVertical: 10,
    textAlign: "center",
  },
  helpText: {
    color: "gray",
    fontStyle: "italic",
    marginTop: 10,
    textAlign: "center",
  },
});

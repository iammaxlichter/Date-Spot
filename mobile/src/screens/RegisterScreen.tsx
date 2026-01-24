// src/screens/RegisterScreen.tsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { supabase } from "../lib/supabase";

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");

  const onRegister = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Email and password are required.");
      return;
    }

    const cleanedUsername = username.trim().toLowerCase();

    if (!/^[a-z0-9_]{3,20}$/.test(cleanedUsername)) {
      Alert.alert(
        "Invalid username",
        "Use 3-20 characters: letters, numbers, underscore."
      );
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim() || null,
            username: cleanedUsername,
          },
        },
      });

      if (error) {
        Alert.alert("Register failed", error.message);
        return;
      }

      // Profile created automatically by trigger!
      Alert.alert("Success", "Account created! Check your email to verify.");

    } catch (e: any) {
      Alert.alert("Register failed", e?.message ?? "Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Name (optional)"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Username (required)"
        autoCapitalize="none"
        value={username}
        onChangeText={(t) => setUsername(t.replace(/[^a-zA-Z0-9_]/g, ""))}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={onRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Creating..." : "Register"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 6,
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
  },
  link: {
    marginTop: 16,
    color: "#555",
    textAlign: "center",
  },
});

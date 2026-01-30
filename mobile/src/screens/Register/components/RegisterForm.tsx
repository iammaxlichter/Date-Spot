// src/screens/Register/components/RegisterForm.tsx
import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { styles } from "../styles";

export function RegisterForm(props: {
  email: string;
  name: string;
  username: string;
  password: string;
  loading: boolean;
  onChangeEmail: (v: string) => void;
  onChangeName: (v: string) => void;
  onChangeUsername: (v: string) => void;
  onChangePassword: (v: string) => void;
  onRegister: () => void;
  onGoLogin: () => void;
}) {
  const {
    email,
    name,
    username,
    password,
    loading,
    onChangeEmail,
    onChangeName,
    onChangeUsername,
    onChangePassword,
    onRegister,
    onGoLogin,
  } = props;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={onChangeEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Name (optional)"
        value={name}
        onChangeText={onChangeName}
      />

      <TextInput
        style={styles.input}
        placeholder="Username (required)"
        autoCapitalize="none"
        value={username}
        onChangeText={(t) => onChangeUsername(t.replace(/[^a-zA-Z0-9_]/g, ""))}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={onChangePassword}
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

      <TouchableOpacity onPress={onGoLogin}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
}

// src/screens/Login/components/LoginForm.tsx
import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { styles } from "../styles";

export function LoginForm(props: {
  email: string;
  password: string;
  loading: boolean;
  onChangeEmail: (v: string) => void;
  onChangePassword: (v: string) => void;
  onLogin: () => void;
  onGoRegister: () => void;
}) {
  const {
    email,
    password,
    loading,
    onChangeEmail,
    onChangePassword,
    onLogin,
    onGoRegister,
  } = props;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>

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
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={onChangePassword}
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={onLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onGoRegister}>
        <Text style={styles.link}>Need an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

// src/screens/Register/components/RegisterForm.tsx
import React from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { styles } from "../styles";

const LOGO_SOURCE = require("../../../../assets/icon.png");

export function RegisterForm(props: {
  email: string;
  name: string;
  username: string;
  password: string;
  loading: boolean;
  googleLoading: boolean;
  passwordError: string | null;
  onChangeEmail: (v: string) => void;
  onChangeName: (v: string) => void;
  onChangeUsername: (v: string) => void;
  onChangePassword: (v: string) => void;
  onRegister: () => void;
  onGoogleRegister: () => void;
  onGoLogin: () => void;
}) {
  const {
    email,
    name,
    username,
    password,
    loading,
    googleLoading,
    passwordError,
    onChangeEmail,
    onChangeName,
    onChangeUsername,
    onChangePassword,
    onRegister,
    onGoogleRegister,
    onGoLogin,
  } = props;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.brandWrap}>
          <Image source={LOGO_SOURCE} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brandTitle}>Date Spot</Text>
        </View>

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
          placeholderTextColor="#8F8F8F"
          value={name}
          onChangeText={onChangeName}
        />

        <TextInput
          style={styles.input}
          placeholder="Username (required)"
          placeholderTextColor="#8F8F8F"
          autoCapitalize="none"
          value={username}
          onChangeText={(t) => onChangeUsername(t.replace(/[^a-zA-Z0-9_]/g, ""))}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#8F8F8F"
          secureTextEntry
          value={password}
          onChangeText={onChangePassword}
        />
        <Text style={[styles.helperText, passwordError ? styles.helperTextError : null]}>
          {passwordError ?? "Use 6+ chars with upper, lower, number, and symbol."}
        </Text>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={onRegister}
          disabled={loading || googleLoading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Creating..." : "Create Account"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.googleButton, googleLoading && { opacity: 0.7 }]}
          onPress={onGoogleRegister}
          disabled={loading || googleLoading}
        >
          <Text style={styles.googleButtonText}>
            {googleLoading ? "Connecting..." : "Create account with Google"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onGoLogin}>
          <Text style={styles.link}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

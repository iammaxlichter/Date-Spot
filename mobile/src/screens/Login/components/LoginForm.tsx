// src/screens/Login/components/LoginForm.tsx
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

export function LoginForm(props: {
  email: string;
  password: string;
  loading: boolean;
  googleLoading: boolean;
  onChangeEmail: (v: string) => void;
  onChangePassword: (v: string) => void;
  onLogin: () => void;
  onGoogleLogin: () => void;
  onGoRegister: () => void;
}) {
  const {
    email,
    password,
    loading,
    googleLoading,
    onChangeEmail,
    onChangePassword,
    onLogin,
    onGoogleLogin,
    onGoRegister,
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
          placeholderTextColor="#8F8F8F"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={onChangeEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#8F8F8F"
          secureTextEntry
          value={password}
          onChangeText={onChangePassword}
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={onLogin}
          disabled={loading || googleLoading}
        >
          <Text style={styles.buttonText}>{loading ? "Logging in..." : "Sign In"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.googleButton, googleLoading && { opacity: 0.7 }]}
          onPress={onGoogleLogin}
          disabled={loading || googleLoading}
        >
          <Text style={styles.googleButtonText}>
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onGoRegister}>
          <Text style={styles.link}>New here? Create your Date Spot account</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

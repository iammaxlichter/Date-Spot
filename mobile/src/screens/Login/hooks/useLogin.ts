// src/screens/Login/hooks/useLogin.ts
import * as React from "react";
import { Alert } from "react-native";
import { supabase } from "../../../services/supabase/client";

export function useLogin() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const onLogin = React.useCallback(async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Email and password are required.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        Alert.alert("Login failed", error.message);
        return;
      }

      // ✅ Do NOT navigate here.
      // RootNavigator's onAuthStateChange will show Home when session exists.
    } catch (e: any) {
      Alert.alert("Login failed", e?.message ?? "Try again.");
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    onLogin,
  };
}

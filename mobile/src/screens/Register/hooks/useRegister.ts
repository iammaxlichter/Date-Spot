// src/screens/Register/hooks/useRegister.ts
import * as React from "react";
import { Alert } from "react-native";
import { supabase } from "../../../services/supabase/client";

export function useRegister() {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const onRegister = React.useCallback(async () => {
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

      Alert.alert("Success", "Account created! Check your email to verify.");
    } catch (e: any) {
      Alert.alert("Register failed", e?.message ?? "Try again.");
    } finally {
      setLoading(false);
    }
  }, [email, password, username, name]);

  return {
    email,
    setEmail,
    name,
    setName,
    password,
    setPassword,
    username,
    setUsername,
    loading,
    onRegister,
  };
}

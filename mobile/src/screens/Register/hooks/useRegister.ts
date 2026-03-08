// src/screens/Register/hooks/useRegister.ts
import * as React from "react";
import { Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "../../../services/supabase/client";

WebBrowser.maybeCompleteAuthSession();

function getParamFromUrl(rawUrl: string, key: string) {
  const encodedKey = encodeURIComponent(key);
  const pattern = new RegExp(`[?#&]${encodedKey}=([^&#]+)`);
  const match = rawUrl.match(pattern);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

const PASSWORD_MIN_LENGTH = 6;

function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!/[a-z]/.test(password)) {
    return "Password must include at least one lowercase letter.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one uppercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include at least one number.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include at least one special character.";
  }
  return null;
}

export function useRegister() {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const passwordError = React.useMemo(() => {
    if (!password) return null;
    return validatePassword(password);
  }, [password]);

  const onRegister = React.useCallback(async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Email and password are required.");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      Alert.alert("Weak password", passwordError);
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

  const onGoogleRegister = React.useCallback(async () => {
    try {
      setGoogleLoading(true);

      const redirectTo = "datespot://auth/callback";
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        Alert.alert("Google sign up failed", error.message);
        return;
      }
      if (!data?.url) {
        Alert.alert("Google sign up failed", "Could not start Google auth.");
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== "success" || !result.url) return;

      const code = getParamFromUrl(result.url, "code");
      if (code) {
        const { error: codeError } = await supabase.auth.exchangeCodeForSession(code);
        if (codeError) Alert.alert("Google sign up failed", codeError.message);
        return;
      }

      const accessToken = getParamFromUrl(result.url, "access_token");
      const refreshToken = getParamFromUrl(result.url, "refresh_token");
      if (!accessToken || !refreshToken) {
        Alert.alert("Google sign up failed", "Missing auth tokens from Google.");
        return;
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) Alert.alert("Google sign up failed", sessionError.message);
    } catch (e: any) {
      Alert.alert("Google sign up failed", e?.message ?? "Try again.");
    } finally {
      setGoogleLoading(false);
    }
  }, []);

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
    googleLoading,
    passwordError,
    onRegister,
    onGoogleRegister,
  };
}

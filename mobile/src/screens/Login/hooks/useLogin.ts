// src/screens/Login/hooks/useLogin.ts
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

export function useLogin() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);

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

  const onGoogleLogin = React.useCallback(async () => {
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
        Alert.alert("Google login failed", error.message);
        return;
      }

      if (!data?.url) {
        Alert.alert("Google login failed", "Could not start Google login.");
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type !== "success" || !result.url) {
        if (result.type !== "cancel") {
          Alert.alert(
            "Google login interrupted",
            `Expected callback: ${redirectTo}\nResult type: ${result.type}`
          );
        }
        return;
      }

      const code = getParamFromUrl(result.url, "code");
      if (code) {
        const { error: codeError } = await supabase.auth.exchangeCodeForSession(code);
        if (codeError) {
          Alert.alert("Google login failed", codeError.message);
        }
        return;
      }

      const accessToken = getParamFromUrl(result.url, "access_token");
      const refreshToken = getParamFromUrl(result.url, "refresh_token");

      if (!accessToken || !refreshToken) {
        Alert.alert(
          "Google login redirect mismatch",
          `Supabase didn't return tokens to app.\n\nExpected callback:\n${redirectTo}\n\nActual return URL:\n${result.url}\n\nAdd the expected callback URL to Supabase Auth > URL Configuration > Redirect URLs.`
        );
        return;
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        Alert.alert("Google login failed", sessionError.message);
      }
    } catch (e: any) {
      Alert.alert("Google login failed", e?.message ?? "Try again.");
    } finally {
      setGoogleLoading(false);
    }
  }, []);

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    googleLoading,
    onLogin,
    onGoogleLogin,
  };
}

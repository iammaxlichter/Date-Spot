import React from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../services/supabase/client";
import type { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ProfileSetup">;

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export default function ProfileSetupScreen({}: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [booting, setBooting] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const { data: authRes, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;
        const user = authRes.user;
        if (!user) return;

        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("name,username")
          .eq("id", user.id)
          .maybeSingle();
        if (profileErr) throw profileErr;

        const meta = user.user_metadata ?? {};
        const inferredName =
          (profile?.name ?? "").trim() ||
          (meta.name as string | undefined)?.trim() ||
          (meta.full_name as string | undefined)?.trim() ||
          "";
        const inferredUsername =
          (profile?.username ?? "").trim().toLowerCase() ||
          ((meta.username as string | undefined) ?? "").trim().toLowerCase();

        setName(inferredName);
        setUsername(inferredUsername);
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? "Failed to load your profile.");
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const onSave = React.useCallback(async () => {
    const cleanedName = name.trim();
    const cleanedUsername = username.trim().toLowerCase();

    if (!cleanedName) {
      Alert.alert("Missing name", "Please enter your name.");
      return;
    }
    if (!USERNAME_REGEX.test(cleanedUsername)) {
      Alert.alert(
        "Invalid username",
        "Use 3-20 characters: lowercase letters, numbers, and underscore."
      );
      return;
    }

    try {
      setLoading(true);

      const { data: authRes, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const user = authRes.user;
      if (!user) throw new Error("Not authenticated");

      const meta = user.user_metadata ?? {};
      const avatar =
        (meta.avatar_url as string | undefined) ??
        (meta.picture as string | undefined) ??
        null;

      const { data: existingUsername, error: usernameCheckErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", cleanedUsername)
        .neq("id", user.id)
        .maybeSingle();
      if (usernameCheckErr) throw usernameCheckErr;
      if (existingUsername) {
        Alert.alert("Username taken", "That username is already in use.");
        return;
      }

      const { error: upsertErr } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          name: cleanedName,
          username: cleanedUsername,
          avatar_url: avatar,
        },
        { onConflict: "id" }
      );
      if (upsertErr) {
        if (upsertErr.code === "23505") {
          Alert.alert("Username taken", "That username is already in use.");
          return;
        }
        throw upsertErr;
      }

      const { error: metaErr } = await supabase.auth.updateUser({
        data: {
          ...meta,
          name: cleanedName,
          username: cleanedUsername,
        },
      });
      if (metaErr) throw metaErr;
    } catch (e: any) {
      Alert.alert("Could not save profile", e?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  }, [name, username]);

  const onBack = React.useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not go back right now.");
    }
  }, []);

  if (booting) {
    return <View style={styles.container} />;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 24, left: 24 }]}
          onPress={onBack}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.contentWrap}>
          <Text style={styles.title}>Complete your profile</Text>
          <Text style={styles.subtitle}>Choose your name and @username to continue.</Text>

          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="done"
          />

          <TextInput
            style={styles.input}
            placeholder="username"
            autoCapitalize="none"
            value={username}
            onChangeText={(text) => setUsername(text.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
            returnKeyType="done"
          />
          <Text style={styles.helperText}>You cannot change your username later!</Text>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            disabled={loading}
            onPress={onSave}
          >
            <Text style={styles.buttonText}>{loading ? "Saving..." : "Continue"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
  },
  contentWrap: {
    width: "100%",
    maxWidth: 420,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1D1D1D",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#5B5B5B",
    marginBottom: 20,
  },
  backButton: {
    position: "absolute",
    paddingVertical: 6,
    paddingHorizontal: 2,
    zIndex: 2,
  },
  backButtonText: {
    color: "#D91B46",
    fontSize: 16,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    color: "#191919",
  },
  helperText: {
    marginTop: -4,
    marginBottom: 12,
    color: "#8A8A8A",
    fontSize: 13,
  },
  button: {
    marginTop: 8,
    backgroundColor: "#E21E4D",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

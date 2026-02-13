import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../../navigation/types";
import { supabase } from "../../services/supabase/client";
import { uploadProfilePicture } from "../../services/supabase/uploadProfilePicture";
import { s } from "./styles";

type Props = NativeStackScreenProps<RootStackParamList, "EditProfile">;

type EditableProfile = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  email: string;
};

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

type BannerState = {
  type: "error" | "success";
  text: string;
} | null;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export default function EditProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [pickingAvatar, setPickingAvatar] = React.useState(false);

  const [initial, setInitial] = React.useState<EditableProfile | null>(null);
  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [avatarAsset, setAvatarAsset] = React.useState<{ uri: string; mimeType?: string } | null>(null);

  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [banner, setBanner] = React.useState<BannerState>(null);

  const loadProfile = React.useCallback(async () => {
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    const user = userRes.user;
    if (!user) throw new Error("Not authenticated");

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("id,name,username,avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (profileErr) throw profileErr;

    const safeName = (profile?.name ?? user.user_metadata?.name ?? "").trim();
    const safeUsername = (profile?.username ?? user.user_metadata?.username ?? "")
      .toString()
      .trim()
      .toLowerCase();
    const safeEmail = (user.email ?? "").trim();
    const safeAvatar = profile?.avatar_url ?? null;

    const next: EditableProfile = {
      id: user.id,
      name: safeName,
      username: safeUsername,
      avatarUrl: safeAvatar,
      email: safeEmail,
    };

    setInitial(next);
    setName(next.name);
    setUsername(next.username);
    setEmail(next.email);
    setAvatarUrl(next.avatarUrl);
    setAvatarAsset(null);
    setPassword("");
    setConfirmPassword("");
  }, []);

  React.useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        await loadProfile();
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadProfile]);

  const normalizedName = name.trim();
  const normalizedEmail = email.trim();

  const isDirty = React.useMemo(() => {
    if (!initial) return false;
    return (
      normalizedName !== initial.name ||
      normalizedEmail !== initial.email ||
      password.length > 0 ||
      confirmPassword.length > 0 ||
      !!avatarAsset
    );
  }, [
    initial,
    normalizedName,
    normalizedEmail,
    password,
    confirmPassword,
    avatarAsset,
  ]);

  const validate = React.useCallback((): FieldErrors => {
    const next: FieldErrors = {};

    if (!normalizedName) {
      next.name = "Name is required.";
    }

    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      next.email = "Enter a valid email address.";
    }

    if (password || confirmPassword) {
      if (password.length < MIN_PASSWORD_LENGTH) {
        next.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
      }
      if (password !== confirmPassword) {
        next.confirmPassword = "Passwords do not match.";
      }
    }

    return next;
  }, [confirmPassword, normalizedEmail, normalizedName, password]);

  const onPickAvatar = React.useCallback(async () => {
    if (pickingAvatar || saving) return;
    try {
      setPickingAvatar(true);
      setBanner(null);

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Please allow photo library access.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      setAvatarAsset({ uri: asset.uri, mimeType: asset.mimeType ?? undefined });
      setAvatarUrl(asset.uri);
    } catch (e: any) {
      Alert.alert("Image selection failed", e?.message ?? "Could not pick image.");
    } finally {
      setPickingAvatar(false);
    }
  }, [pickingAvatar, saving]);

  const onSave = React.useCallback(async () => {
    if (!initial || saving) return;

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setBanner({ type: "error", text: "Fix the highlighted fields, then save again." });
      return;
    }

    if (!isDirty) return;

    setSaving(true);
    setBanner(null);

    const savedParts: string[] = [];
    const failedParts: string[] = [];
    const failedMessages: string[] = [];
    const nextFieldErrors: FieldErrors = {};

    let uploadedAvatarUrl: string | null = null;
    let profileRowSaved = false;
    let emailSaved = false;
    let passwordSaved = false;

    try {
      if (avatarAsset) {
        try {
          const { publicUrl } = await uploadProfilePicture({
            userId: initial.id,
            uri: avatarAsset.uri,
            mimeType: avatarAsset.mimeType,
          });
          uploadedAvatarUrl = publicUrl;
          savedParts.push("avatar upload");
        } catch (e: any) {
          failedParts.push("avatar upload");
          failedMessages.push(`Avatar: ${e?.message ?? "Upload failed."}`);
        }
      }

      const changedProfileFields: { name?: string; avatar_url?: string | null } = {};

      if (normalizedName !== initial.name) {
        changedProfileFields.name = normalizedName;
      }
      if (uploadedAvatarUrl && uploadedAvatarUrl !== initial.avatarUrl) {
        changedProfileFields.avatar_url = uploadedAvatarUrl;
      }

      if (Object.keys(changedProfileFields).length > 0) {
        try {
          const { error: profileErr } = await supabase
            .from("profiles")
            .update(changedProfileFields)
            .eq("id", initial.id);

          if (profileErr) throw profileErr;
          profileRowSaved = true;
          savedParts.push("profile details");
        } catch (e: any) {
          const msg = e?.message ?? "Profile update failed.";
          failedParts.push("profile details");
          failedMessages.push(`Profile: ${msg}`);
        }
      }

      if (normalizedEmail !== initial.email) {
        try {
          const { error: emailErr } = await supabase.auth.updateUser({ email: normalizedEmail });
          if (emailErr) throw emailErr;
          emailSaved = true;
          savedParts.push("email update");
        } catch (e: any) {
          const msg = e?.message ?? "Email update failed.";
          failedParts.push("email update");
          failedMessages.push(`Email: ${msg}`);
          nextFieldErrors.email = msg;
        }
      }

      if (password) {
        try {
          const { error: passwordErr } = await supabase.auth.updateUser({ password });
          if (passwordErr) throw passwordErr;
          passwordSaved = true;
          savedParts.push("password update");
        } catch (e: any) {
          const msg = e?.message ?? "Password update failed.";
          failedParts.push("password update");
          failedMessages.push(`Password: ${msg}`);
          nextFieldErrors.password = msg;
        }
      }

      if (Object.keys(nextFieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...nextFieldErrors }));
      }

      const resolvedAvatarUrl =
        uploadedAvatarUrl && profileRowSaved ? uploadedAvatarUrl : initial.avatarUrl;

      const updatedInitial: EditableProfile = {
        id: initial.id,
        name: profileRowSaved ? normalizedName : initial.name,
        username: initial.username,
        avatarUrl: resolvedAvatarUrl,
        email: emailSaved ? normalizedEmail : initial.email,
      };
      setInitial(updatedInitial);
      setName(updatedInitial.name);
      setUsername(updatedInitial.username);
      setEmail(updatedInitial.email);
      setAvatarUrl(updatedInitial.avatarUrl);

      if (passwordSaved) {
        setPassword("");
        setConfirmPassword("");
      }
      if (profileRowSaved || uploadedAvatarUrl) {
        setAvatarAsset(null);
      }

      if (failedParts.length === 0) {
        const successMessage =
          normalizedEmail !== initial.email
            ? "Saved. Check your email to confirm the new address if prompted."
            : "Profile updated.";
        setBanner({ type: "success", text: successMessage });
        Alert.alert("Success", successMessage, [{ text: "OK", onPress: () => navigation.goBack() }]);
        return;
      }

      const partialSummary = [
        savedParts.length ? `Saved: ${savedParts.join(", ")}.` : null,
        `Not saved: ${failedParts.join(", ")}.`,
        failedMessages.join("\n"),
      ]
        .filter(Boolean)
        .join("\n");

      setBanner({
        type: "error",
        text: "Some updates failed. Review the messages and try again.",
      });
      Alert.alert("Partial save", partialSummary);
    } finally {
      setSaving(false);
    }
  }, [
    avatarAsset,
    confirmPassword,
    initial,
    isDirty,
    navigation,
    normalizedEmail,
    normalizedName,
    password,
    saving,
    validate,
  ]);

  const avatarSource: ImageSourcePropType = avatarUrl
    ? { uri: avatarUrl }
    : require("../../../assets/default-avatar.png");

  const disableSave = saving || loading || !isDirty;

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {banner ? (
          <View style={[s.banner, banner.type === "error" ? s.bannerError : s.bannerSuccess]}>
            <Text style={s.bannerText}>{banner.text}</Text>
          </View>
        ) : null}

        <View style={s.avatarWrap}>
          <Pressable style={s.avatarPressable} onPress={onPickAvatar} disabled={saving || pickingAvatar}>
            <Image source={avatarSource} style={s.avatar} />
          </Pressable>
          <Text style={s.avatarHint}>
            {pickingAvatar ? "Selecting image..." : "Tap profile picture to change"}
          </Text>
        </View>

        <View style={s.field}>
          <Text style={s.label}>Name</Text>
          <TextInput
            style={[s.input, errors.name ? s.inputError : null]}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={40}
          />
          {errors.name ? <Text style={s.errorText}>{errors.name}</Text> : null}
        </View>

        <View style={s.field}>
          <Text style={s.label}>Username</Text>
          <TextInput
            style={[s.input, s.inputReadOnly]}
            value={username}
            editable={false}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={s.helperText}>Username cannot be changed.</Text>
        </View>

        <View style={s.field}>
          <Text style={s.label}>Email</Text>
          <TextInput
            style={[s.input, errors.email ? s.inputError : null]}
            value={email}
            onChangeText={setEmail}
            placeholder="name@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errors.email ? <Text style={s.errorText}>{errors.email}</Text> : null}
        </View>

        <View style={s.field}>
          <Text style={s.label}>New Password</Text>
          <TextInput
            style={[s.input, errors.password ? s.inputError : null]}
            value={password}
            onChangeText={setPassword}
            placeholder="Leave blank to keep current password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errors.password ? <Text style={s.errorText}>{errors.password}</Text> : null}
        </View>

        <View style={s.field}>
          <Text style={s.label}>Confirm Password</Text>
          <TextInput
            style={[s.input, errors.confirmPassword ? s.inputError : null]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter new password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errors.confirmPassword ? <Text style={s.errorText}>{errors.confirmPassword}</Text> : null}
        </View>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: Math.max(10, insets.bottom) }]}>
        <Pressable
          style={[s.saveButton, disableSave ? s.saveButtonDisabled : null]}
          onPress={onSave}
          disabled={disableSave}
        >
          <Text style={s.saveButtonText}>{saving ? "Saving..." : "Save"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

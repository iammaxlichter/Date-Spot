import React from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../../navigation/types";
import { logout } from "../../services/api/auth";
import { AppBackButton } from "../../components/navigation/AppBackButton";
import { s } from "./styles";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const onLogout = React.useCallback(async () => {
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      await logout();
    } catch (e: any) {
      Alert.alert("Log out failed", e?.message ?? "Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }, [loggingOut]);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 28 }]}
    >
      <View style={s.backButton}>
        <AppBackButton onPress={() => navigation.goBack()} />
      </View>

      <View style={s.hero}>
        <Text style={s.eyebrow}>Account</Text>
        <Text style={s.title}>Settings</Text>
        <Text style={s.subtitle}>Manage your account and preferences.</Text>
      </View>

      <View style={s.card}>
        <Pressable
          style={({ pressed }) => pressed && { opacity: 0.6 }}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <View style={s.row}>
            <Text style={s.rowText}>Edit Profile</Text>
            <Text style={s.rowChevron}>{">"}</Text>
          </View>
        </Pressable>

        <View style={s.rowDivider} />

        <Pressable
          style={({ pressed }) => pressed && { opacity: 0.6 }}
          onPress={() => navigation.navigate("PrivacySettings")}
        >
          <View style={s.row}>
            <View>
              <Text style={s.rowText}>Privacy and Access</Text>
            </View>
            <Text style={s.rowChevron}>{">"}</Text>
          </View>
        </Pressable>
      </View>

      <View style={s.card}>
        <Pressable
          style={({ pressed }) => pressed && { opacity: 0.6 }}
          onPress={onLogout}
          disabled={loggingOut}
        >
          <View style={s.row}>
            <Text style={[s.rowText, s.rowTextDanger]}>
              {loggingOut ? "Logging out..." : "Log out"}
            </Text>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

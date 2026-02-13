import React from "react";
import { Alert, Pressable, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../../navigation/types";
import { logout } from "../../services/api/auth";
import { s } from "./styles";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
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
    <View style={s.container}>
      <Pressable style={s.button} onPress={() => navigation.navigate("EditProfile")}>
        <Text style={s.buttonText}>Edit Profile</Text>
      </Pressable>

      <Pressable
        style={[s.button, s.dangerButton, loggingOut && { opacity: 0.7 }]}
        onPress={onLogout}
        disabled={loggingOut}
      >
        <Text style={[s.buttonText, s.dangerButtonText]}>
          {loggingOut ? "Logging out..." : "Log out"}
        </Text>
      </Pressable>
    </View>
  );
}

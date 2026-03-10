import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../../navigation/types";
import { AppBackButton } from "../../components/navigation/AppBackButton";
import { s } from "./styles";

type Props = NativeStackScreenProps<RootStackParamList, "PrivacySettings">;

export default function PrivacySettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 28 }]}
    >
      <View style={s.backButton}>
        <AppBackButton onPress={() => navigation.goBack()} />
      </View>

      <View style={s.hero}>
        <Text style={s.eyebrow}>Privacy</Text>
        <Text style={s.title}>Privacy and Access</Text>
        <Text style={s.subtitle}>
          Controls for account visibility, follower approvals, messaging, and future privacy tools.
        </Text>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Coming soon</Text>
        <Text style={s.cardBody}>
          This page is ready for settings like private account mode, profile visibility, who can
          interact with you, and other account controls.
        </Text>
      </View>
    </ScrollView>
  );
}

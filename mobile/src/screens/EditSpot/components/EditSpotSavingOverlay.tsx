// src/screens/EditSpot/components/EditSpotSavingOverlay.tsx
import React from "react";
import { View, ActivityIndicator, Text } from "react-native";

export function EditSpotSavingOverlay(props: { visible: boolean }) {
  if (!props.visible) return null;

  return (
    <View style={{ padding: 16, alignItems: "center" }}>
      <ActivityIndicator size="large"  color="#E21E4D" />
      <Text style={{ marginTop: 10 }}>Saving…</Text>
    </View>
  );
}

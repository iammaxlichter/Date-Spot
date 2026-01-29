// src/screens/EditSpot/components/EditSpotLoading.tsx
import React from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { styles } from "../styles";

export function EditSpotLoading() {
  return (
    <View
      style={[
        styles.bottomSheet,
        { justifyContent: "center", alignItems: "center" },
      ]}
    >
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 10 }}>Loading…</Text>
    </View>
  );
}

// src/screens/SpotDetails/components/SpotDetailsLoading.tsx
import React from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { s } from "../styles";

export function SpotDetailsLoading() {
  return (
    <View style={[s.screen, { justifyContent: "center", alignItems: "center" }]}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 10 }}>Loading DateSpot…</Text>
    </View>
  );
}

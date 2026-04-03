// src/screens/SpotDetails/components/SpotDetailsLoading.tsx
import React from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { s } from "../styles";

export function SpotDetailsLoading() {
  return (
    <View style={s.loadingWrap}>
      <ActivityIndicator size="large" color="#E21E4D" />
      <Text style={s.loadingText}>Loading Date Spot...</Text>
    </View>
  );
}

// src/screens/FollowingList/components/FollowingErrorBanner.tsx
import React from "react";
import { View, Text } from "react-native";
import { styles } from "../styles";

export function FollowingErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

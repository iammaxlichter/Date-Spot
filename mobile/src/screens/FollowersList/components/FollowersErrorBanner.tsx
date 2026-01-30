// src/screens/FollowersList/components/FollowersErrorBanner.tsx
import React from "react";
import { View, Text } from "react-native";
import { styles } from "../styles";

export function FollowersErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

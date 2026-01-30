// src/screens/Users/components/UsersSearchBar.tsx
import React from "react";
import { View, TextInput, ActivityIndicator } from "react-native";
import { styles } from "../styles";

export function UsersSearchBar({
  value,
  onChangeText,
  loading,
}: {
  value: string;
  onChangeText: (t: string) => void;
  loading: boolean;
}) {
  return (
    <View style={styles.header}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        placeholder="Search by username..."
        style={styles.searchInput}
      />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator />
        </View>
      ) : null}
    </View>
  );
}

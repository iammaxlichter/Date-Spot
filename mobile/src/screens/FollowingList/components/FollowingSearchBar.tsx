// src/screens/FollowingList/components/FollowingSearchBar.tsx
import React from "react";
import { View, TextInput } from "react-native";
import { styles } from "../styles";

export function FollowingSearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search following..."
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

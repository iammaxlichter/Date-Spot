// src/screens/FollowingList/components/FollowingSearchBar.tsx
import React from "react";
import { View, TextInput, Pressable, Text } from "react-native";
import { styles } from "../styles";

export function FollowingSearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.searchInputWrap}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search following..."
        placeholderTextColor="#9A9A9A"
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.trim().length > 0 ? (
        <Pressable
          onPress={() => onChange("")}
          hitSlop={8}
          style={styles.searchClearBtn}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Text style={styles.searchClearBtnText}>X</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

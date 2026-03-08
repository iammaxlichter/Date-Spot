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
    <View style={styles.searchWrap}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        placeholder="Search by name..."
        placeholderTextColor="#9A9A9A"
        style={styles.searchInput}
        autoCorrect={false}
      />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#E21E4D"  />
        </View>
      ) : null}
    </View>
  );
}

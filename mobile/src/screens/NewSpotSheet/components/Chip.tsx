// src/screens/NewSpotSheet/components/Chip.tsx
import React from "react";
import { TouchableOpacity, Text } from "react-native";

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 999,
          borderWidth: 1,
          marginRight: 8,
          marginBottom: 8,
        },
        selected
          ? { backgroundColor: "#111", borderColor: "#111" }
          : { backgroundColor: "transparent", borderColor: "#ccc" },
      ]}
    >
      <Text style={selected ? { color: "#fff", fontWeight: "700" } : { color: "#111" }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

import React from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function FilterChip({ label, selected, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipSelected : styles.chipUnselected]}
    >
      <Text style={[styles.text, selected ? styles.textSelected : styles.textUnselected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  chipUnselected: {
    backgroundColor: "#fff",
    borderColor: "#d2d2d2",
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
  },
  textSelected: {
    color: "#fff",
  },
  textUnselected: {
    color: "#222",
  },
});

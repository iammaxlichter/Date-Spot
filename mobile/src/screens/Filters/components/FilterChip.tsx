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
      activeOpacity={0.75}
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: "#E21E4D",
    borderColor: "#E21E4D",
  },
  chipUnselected: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E7E7E7",
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
  },
  textSelected: {
    color: "#FFFFFF",
  },
  textUnselected: {
    color: "#4A4A4A",
  },
});

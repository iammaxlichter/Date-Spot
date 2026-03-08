import React from "react";
import { Pressable, Text, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AppBackButton({ onPress, disabled = false, compact = false, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        compact ? styles.compact : styles.regular,
        pressed ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
      hitSlop={8}
    >
      <Text style={[styles.text, compact ? styles.textCompact : null]}>{"< Back"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderColor: "#F2D9E0",
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  regular: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  compact: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  text: {
    color: "#D91B46",
    fontSize: 14,
    fontWeight: "700",
  },
  textCompact: {
    fontSize: 13,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});

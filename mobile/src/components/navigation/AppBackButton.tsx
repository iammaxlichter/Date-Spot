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
        compact ? styles.regular : styles.regular,
        pressed ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
      hitSlop={8}
    >
      <Text style={styles.text}>{"< Back"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  regular: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: {
    color: "#D91B46",
    fontSize: 14,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});

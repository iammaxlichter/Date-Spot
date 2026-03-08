import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";

type Props = {
  label: string;
  checked: boolean;
  onPress: () => void;
  avatarUrl?: string | null;
};

export function FilterCheckboxRow({ label, checked, onPress, avatarUrl }: Props) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.left}>
        {avatarUrl !== undefined ? (
          <Image
            source={
              avatarUrl
                ? { uri: avatarUrl }
                : require("../../../../assets/default-avatar.png")
            }
            style={styles.avatar}
          />
        ) : null}
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>

      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1D1D1D",
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#D5D5D5",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxChecked: {
    borderColor: "#E21E4D",
    backgroundColor: "#E21E4D",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 14,
  },
});

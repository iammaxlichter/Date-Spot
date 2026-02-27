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
    <TouchableOpacity style={styles.row} onPress={onPress}>
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
        {checked ? <Text style={styles.checkmark}>X</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#efefef",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    backgroundColor: "#eee",
  },
  label: {
    fontSize: 14,
    color: "#222",
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#b7b7b7",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    borderColor: "#111",
    backgroundColor: "#111",
  },
  checkmark: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 14,
  },
});

// src/screens/components/PinPlacementOverlay.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function PinPlacementOverlay(props: {
  visible: boolean;
  onCancel: () => void;
  onNext: () => void;
}) {
  const { visible, onCancel, onNext } = props;
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Top instruction card */}
      <View style={[s.topCard, { top: 8 }]} pointerEvents="none">
        <Text style={s.title}>Drop your pin</Text>
        <View style={s.divider} />
        <Text style={s.subtitle}>Move the map to the exact spot, then confirm</Text>
      </View>

      {/* Bottom action bar */}
      <View
        style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 24) }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity style={s.cancelBtn} onPress={onCancel} activeOpacity={0.75}>
          <Text style={s.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.confirmBtn} onPress={onNext} activeOpacity={0.85}>
          <MaterialIcons name="check" size={17} color="#fff" style={s.confirmIcon} />
          <Text style={s.confirmText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  topCard: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E7E7E7",
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    zIndex: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: "#777",
    lineHeight: 18,
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E7E7E7",
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: "#E21E4D",
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E21E4D",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  confirmIcon: {
    marginRight: 5,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
  },
});

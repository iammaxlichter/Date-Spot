import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function BottomOverlay(props: {
  activeRoute?: string;
  onGoHome: () => void;
  onSearch: () => void;
  onGoProfile: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { activeRoute, onGoHome, onSearch, onGoProfile } = props;

  const isSearch = activeRoute === "Search";
  const isHome = activeRoute === "Home";
  const isProfile = activeRoute === "Profile";

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity style={styles.tab} onPress={onGoHome}>
          <Text style={[styles.tabText, isHome && styles.tabTextActive]}>Feed</Text>
        </TouchableOpacity>

        {/* Center floating button */}
        <View style={styles.centerWrap}>
          <TouchableOpacity style={styles.centerBtn} onPress={onSearch}>
            <Text style={styles.centerBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.tab} onPress={onGoProfile}>
          <Text style={[styles.tabText, isProfile && styles.tabTextActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e6e6e6",
    height: 68,
    paddingTop: 0,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  tab: {
    width: 90,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 13,
    color: "#777",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#111",
  },

  centerWrap: {
    width: 90,
    alignItems: "center",
  },
  centerBtn: {
    width: 32,
    height: 32,
    borderRadius: 32,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10, // makes it float above the bar
  },
  centerBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },
});

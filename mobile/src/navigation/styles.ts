// src/navigation/styles.ts
import { StyleSheet } from "react-native";

export const navStyles = StyleSheet.create({
  // BottomOverlay
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
    marginBottom: 10,
  },

  centerBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },

  // FeedHeader
  headerWrapper: {
    backgroundColor: "#fff",
  },

  headerRow: {
    height: 48,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});

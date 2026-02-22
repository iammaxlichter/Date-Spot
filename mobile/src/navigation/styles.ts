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

  menuButton: {
    paddingVertical: 10,
    marginLeft: 8,
    marginTop: 6,
  },

  menuIcon: {
    fontSize: 28,
    fontWeight: "600",
    color: "#111",
    lineHeight: 30,
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  drawerContent: {
    paddingTop: 6,
    paddingHorizontal: 10,
  },

  drawerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginBottom: 8,
  },

  drawerHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },

  drawerCloseButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  drawerCloseIcon: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },

  drawerItem: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginVertical: 2,
  },

  drawerItemActive: {
    backgroundColor: "#f2f2f2",
  },

  drawerItemText: {
    fontSize: 17,
    fontWeight: "500",
    color: "#222",
  },

  drawerItemTextActive: {
    fontWeight: "700",
    color: "#111",
  },
});

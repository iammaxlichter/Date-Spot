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
    paddingHorizontal: 28,
    paddingBottom: 32,
  },

  drawerHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingLeft: 12,
  },

  drawerEyebrow: {
    color: "#E21E4D",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  drawerHeaderTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1D1D1D",
    letterSpacing: -0.3,
  },

  drawerCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F2D9E0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  drawerCloseIcon: {
    fontSize: 14,
    fontWeight: "700",
    color: "#D91B46",
  },

  drawerDivider: {
    height: 1,
    backgroundColor: "#EFEFEF",
    marginBottom: 8,
  },

  drawerItem: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginVertical: 2,
  },

  drawerItemActive: {
    backgroundColor: "#FFF5F7",
  },

  drawerItemText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1D1D1D",
  },

  drawerItemTextActive: {
    color: "#E21E4D",
    fontWeight: "700",
  },
});

// src/screens/FollowersList/styles.ts
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  searchSpinner: {
    marginBottom: 12,
  },
  backButton: {
    alignSelf: "flex-start",
    marginTop: 4,
    marginBottom: 16,
  },

  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
    marginBottom: 16,
    marginHorizontal: -20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9A9A9A",
  },
  tabTextActive: {
    color: "#E21E4D",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "50%",
    height: 2,
    backgroundColor: "#E21E4D",
  },

  // Search bar
  searchInputWrap: {
    position: "relative",
  },
  searchInput: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#E7E7E7",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingRight: 44,
    paddingVertical: 12,
    fontSize: 15,
    color: "#191919",
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },
  searchClearBtn: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E21E4D",
  },
  searchClearBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 14,
  },

  // Error banner
  errorContainer: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: "#FFF0F3",
    borderWidth: 1,
    borderColor: "#FCCDD7",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: {
    color: "#C0183D",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  emptyText: {
    color: "#9A9A9A",
    fontSize: 14,
    textAlign: "center",
    marginTop: 32,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
  },

  // Row card
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EFEFEF",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
    backgroundColor: "#EFEFEF",
    overflow: "hidden",
  },
  usernameWrap: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1D1D1D",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  followBtnFollowing: {
    borderColor: "#D5D5D5",
    backgroundColor: "#FFFFFF",
  },
  followBtnNotFollowing: {
    borderColor: "#E21E4D",
    backgroundColor: "#E21E4D",
  },
  followBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  followBtnTextFollowing: {
    color: "#4A4A4A",
  },
  followBtnTextNotFollowing: {
    color: "#FFFFFF",
  },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E21E4D",
    marginLeft: 8,
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 14,
  },
});

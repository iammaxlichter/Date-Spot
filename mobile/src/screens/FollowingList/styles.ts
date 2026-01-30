// src/screens/FollowingList/styles.ts
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    padding: 12,
    backgroundColor: "#fff",
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: "#fff",
  },
  errorContainer: {
    padding: 16,
    backgroundColor: "#fee",
  },
  errorText: {
    color: "#c33",
    textAlign: "center",
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 120,
  },
  emptyText: {
    padding: 16,
    color: "#666",
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: 16,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    minHeight: 72,
  },
  userItemPressed: {
    backgroundColor: "#f5f5f5",
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  leftBlock: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },

  username: {
    fontWeight: "600",
    fontSize: 16,
    color: "#000",
    marginLeft: 12,
  },

  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },

  followBtnPrimary: {
    backgroundColor: "#111",
    borderColor: "#111",
  },

  followingBtn: {
    backgroundColor: "#fff",
    borderColor: "#ddd",
  },

  followBtnText: {
    fontWeight: "700",
    fontSize: 13,
  },

  followBtnTextPrimary: {
    color: "#fff",
  },

  followingBtnText: {
    color: "#111",
  },
});

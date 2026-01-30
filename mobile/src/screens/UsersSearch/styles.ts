// src/screens/Users/styles.ts
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    padding: 16,
  },

  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
  },

  loadingWrap: {
    marginTop: 10,
  },

  listContent: {
    paddingBottom: 120,
  },

  emptyText: {
    marginLeft: 16,
    color: "#666",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },

  usernameWrap: {
    flex: 1,
    backgroundColor: "#fff",
  },

  username: {
    fontWeight: "700",
  },

  followBtn: {
    borderWidth: 1,
    borderColor: "#111",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },

  followBtnFollowing: {
    backgroundColor: "#fff",
  },

  followBtnNotFollowing: {
    backgroundColor: "#111",
  },

  followBtnText: {
    fontWeight: "800",
  },

  followBtnTextFollowing: {
    color: "#111",
  },

  followBtnTextNotFollowing: {
    color: "white",
  },
});

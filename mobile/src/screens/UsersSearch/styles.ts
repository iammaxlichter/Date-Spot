import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  searchWrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },

  searchInput: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#E7E7E7",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#191919",
    backgroundColor: "#FFFFFF",
  },

  loadingWrap: {
    marginTop: 12,
    alignItems: "center",
  },

  listContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 120,
  },

  emptyText: {
    color: "#9A9A9A",
    fontSize: 14,
    marginTop: 32,
    textAlign: "center",
  },

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
  },

  usernameWrap: {
    flex: 1,
  },

  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1D1D1D",
  },

  username: {
    fontSize: 12,
    color: "#9A9A9A",
    marginTop: 1,
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
});

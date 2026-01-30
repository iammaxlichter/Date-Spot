import { StyleSheet } from "react-native";

export const s = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 48,
    paddingBottom: 120,
    backgroundColor: "white",
  },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 14 },
  name: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  username: { fontSize: 14, color: "#666", marginBottom: 10 },

  followButton: {
    backgroundColor: "#111",
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 24,
  },
  followingButton: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd" },
  followButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  followingButtonText: { color: "#111" },

  statsRow: { flexDirection: "row", gap: 22 },
  statBox: {
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    minWidth: 120,
  },
  statNumber: { fontSize: 20, fontWeight: "700" },
  statLabel: { marginTop: 4, fontSize: 13, color: "#666" },

  partnerWrap: { width: "100%", paddingHorizontal: 24, marginTop: 24 },
  partnerCard: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  partnerHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  partnerTitle: { fontSize: 14, fontWeight: "800" },
  partnerBody: { fontSize: 13, color: "#333" },
  partnerDots: { fontSize: 22, fontWeight: "800", paddingHorizontal: 6 },

  primaryBtn: {
    backgroundColor: "#111",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  secondaryBtnText: { color: "#111", fontWeight: "800" },

  outgoingPill: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  primaryWideBtn: {
    backgroundColor: "#111",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryWideBtnText: { color: "#fff", fontWeight: "800" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  menuCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 6,
    width: "100%",
    maxWidth: 320,
  },
  menuItem: { paddingVertical: 14, paddingHorizontal: 18 },
  menuDanger: { color: "#d11a2a", fontWeight: "700", fontSize: 15 },
  menuCancel: { color: "#111", fontWeight: "700", fontSize: 15 },
});

// src/screens/SpotDetails/styles.ts
import { StyleSheet } from "react-native";

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },

  card: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#fff",
    position: "relative", // ✅ needed for absolute edit button
  },

  editBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
    zIndex: 10,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111",
  },

  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: { width: 46, height: 46, borderRadius: 23, marginRight: 10 },

  username: { fontSize: 14, fontWeight: "800", color: "#111" },
  time: { fontSize: 12, color: "#777", marginTop: 2 },

  title: { fontSize: 22, fontWeight: "900", color: "#111", marginTop: 6 },
  photoSection: { marginTop: 10 },
  photoRow: { gap: 10, paddingRight: 4 },
  photoThumb: {
    width: 92,
    height: 92,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  photoModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  photoModalClose: {
    position: "absolute",
    top: 56,
    right: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  photoModalCloseText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  photoModalImage: {
    width: "100%",
    height: "80%",
  },

  section: { marginTop: 14 },
  label: { fontSize: 13, fontWeight: "800", color: "#111", marginBottom: 8 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
    paddingVertical: 6,
  },
  k: { fontSize: 13, color: "#666" },
  v: { fontSize: 13, color: "#111", fontWeight: "700" },

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    borderWidth: 1,
    borderColor: "#eee",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    color: "#111",
    backgroundColor: "#fafafa",
  },

  notes: { fontSize: 13, lineHeight: 18, color: "#222" },
  link: { marginTop: 8, fontSize: 13, fontWeight: "800", color: "#111" },
  wentWithRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  wentWithUser: {
    fontSize: 13,
    color: "#1b5fc6",
    fontWeight: "700",
  },
  partnerWithLine: {
    fontSize: 13,
    color: "#111",
    fontWeight: "800",
  },
});

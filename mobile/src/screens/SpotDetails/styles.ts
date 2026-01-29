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
});

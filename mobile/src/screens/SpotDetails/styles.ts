// src/screens/SpotDetails/styles.ts
import { StyleSheet } from "react-native";

export const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 10,
    color: "#616161",
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 14,
  },

  card: {
    borderWidth: 1,
    borderColor: "#EFEFEF",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    position: "relative",
    overflow: "hidden",
  },

  accentBar: {
    height: 4,
    backgroundColor: "#FDE7ED",
    marginHorizontal: -18,
    marginTop: -18,
    marginBottom: 16,
  },

  editBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    minWidth: 58,
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FDD5DE",
    backgroundColor: "#FFF0F3",
    zIndex: 10,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#D91B46",
    letterSpacing: 0.2,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#FDE7ED",
  },
  username: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1D1D1D",
  },
  time: {
    fontSize: 12,
    color: "#7A7A7A",
    marginTop: 2,
  },

  eyebrow: {
    color: "#D91B46",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    fontSize: 29,
    lineHeight: 34,
    fontWeight: "800",
    color: "#1D1D1D",
    marginBottom: 10,
    paddingRight: 82,
  },

  photoSection: {
    marginTop: 2,
  },
  photoRow: {
    gap: 10,
    paddingRight: 2,
  },
  photoThumb: {
    width: 112,
    height: 112,
    borderRadius: 14,
    backgroundColor: "#F2F2F2",
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
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  photoModalImage: {
    width: "100%",
    height: "80%",
  },

  section: {
    marginTop: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D91B46",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  // ── Stats chips (mirrors profile spot card chips) ─────────────
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chipDate: {
    backgroundColor: "#E21E4D",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipDateText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  chipAtmo: {
    backgroundColor: "#F5F5F5",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipAtmoText: {
    color: "#444",
    fontSize: 13,
    fontWeight: "700",
  },
  chipReturn: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipReturnYes: {
    backgroundColor: "#DCFCE7",
  },
  chipReturnNo: {
    backgroundColor: "#F5F5F5",
  },
  chipReturnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  chipReturnYesText: {
    color: "#16A34A",
  },
  chipReturnNoText: {
    color: "#888",
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    borderWidth: 1,
    borderColor: "#FDD5DE",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    color: "#1D1D1D",
    backgroundColor: "#FFF5F7",
    fontWeight: "600",
  },

  notes: {
    fontSize: 14,
    lineHeight: 21,
    color: "#303030",
  },
  link: {
    marginTop: 9,
    fontSize: 13,
    fontWeight: "800",
    color: "#D91B46",
  },

  wentWithRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  wentWithUser: {
    fontSize: 14,
    color: "#D91B46",
    fontWeight: "700",
  },
  partnerWithLine: {
    fontSize: 14,
    color: "#D91B46",
    fontWeight: "700",
  },
});

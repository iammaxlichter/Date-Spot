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

  // ─── Reviews ───────────────────────────────────────────────────
  reviewsSection: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  reviewsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  reviewsHeaderLeft: {
    flex: 1,
    gap: 2,
  },
  reviewStatsBadge: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  reviewStatsCount: {
    fontSize: 13,
    fontWeight: "400",
    color: "#666",
  },
  addReviewBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fafafa",
  },
  addReviewBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111",
  },
  reviewLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
  },
  reviewLoadingText: {
    fontSize: 13,
    color: "#aaa",
  },
  reviewEmpty: {
    paddingVertical: 20,
    alignItems: "center",
    gap: 4,
  },
  reviewEmptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111",
  },
  reviewEmptySubtitle: {
    fontSize: 13,
    color: "#999",
  },
  reviewCard: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewEditBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f5f5f5",
  },
  reviewEditBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#555",
  },
  reviewCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  reviewStars: {
    fontSize: 14,
    color: "#f5a623",
  },
  reviewDate: {
    fontSize: 12,
    color: "#999",
  },
  reviewAuthor: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
    marginBottom: 4,
  },
  reviewNotesBox: {
    marginTop: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 10,
  },
  reviewNotesLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  reviewText: {
    fontSize: 13,
    color: "#222",
    lineHeight: 18,
  },

  // ─── Add/Edit Review Modal ──────────────────────────────────────
  reviewModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  reviewModalCard: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  },
  reviewModalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111",
    marginBottom: 16,
  },
  reviewModalLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
    marginBottom: 8,
  },
  reviewStarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  reviewStarBtn: {
    padding: 2,
  },
  reviewStarIcon: {
    fontSize: 32,
    color: "#ddd",
  },
  reviewStarIconActive: {
    color: "#f5a623",
  },
  reviewStarLabel: {
    fontSize: 13,
    color: "#555",
    fontWeight: "600",
    marginLeft: 4,
  },
  reviewTextInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#111",
    minHeight: 100,
    backgroundColor: "#fafafa",
  },
  reviewCharCount: {
    fontSize: 11,
    color: "#aaa",
    textAlign: "right",
    marginTop: 4,
    marginBottom: 12,
  },
  reviewModalError: {
    fontSize: 13,
    color: "#d11a2a",
    marginBottom: 12,
    fontWeight: "600",
  },
  reviewModalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
  reviewModalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    minWidth: 80,
    alignItems: "center",
  },
  reviewModalBtnPrimary: { backgroundColor: "#111" },
  reviewModalBtnSecondary: { backgroundColor: "#f2f2f2" },
  reviewModalBtnTextPrimary: { color: "#fff", fontWeight: "700", fontSize: 14 },
  reviewModalBtnTextSecondary: { color: "#111", fontWeight: "700", fontSize: 14 },

  // ─── Form: number selector ───────────────────────────────────────
  reviewNumRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  reviewNumBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
  },
  reviewNumBtnActive: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  reviewNumText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
  },
  reviewNumTextActive: {
    color: "#fff",
  },

  // ─── Form: toggle (Would Return) ─────────────────────────────────
  reviewToggleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  reviewToggleBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  reviewToggleBtnActive: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  reviewToggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
  },
  reviewToggleTextActive: {
    color: "#fff",
  },

  // ─── Form: chip row ───────────────────────────────────────────────
  reviewChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  reviewChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  reviewChipActive: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  reviewChipText: {
    fontSize: 13,
    color: "#444",
    fontWeight: "500",
  },
  reviewChipTextActive: {
    color: "#fff",
    fontWeight: "700",
  },

  // ─── Form: photos ─────────────────────────────────────────────────
  reviewPhotoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  reviewPhotoAddBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  reviewPhotoAddBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
  },
  reviewPhotoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  reviewPhotoThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  reviewPhotoRemoveBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewPhotoRemoveBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 16,
  },

  // ─── ReviewCard: photos, scores, tags ─────────────────────────────
  reviewCardPhotoScroll: {
    marginTop: 8,
    marginBottom: 8,
  },
  reviewCardPhoto: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  reviewScoreRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
  },
  reviewScorePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#f5f5f5",
  },
  reviewScorePillYes: {
    backgroundColor: "#f0fff4",
    borderColor: "#c6f6d5",
  },
  reviewScorePillNo: {
    backgroundColor: "#fff5f5",
    borderColor: "#fed7d7",
  },
  reviewScoreLabel: {
    fontSize: 11,
    color: "#777",
  },
  reviewScoreValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111",
  },
  reviewTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
  },
  reviewTag: {
    fontSize: 11,
    color: "#555",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
    overflow: "hidden",
  },
});

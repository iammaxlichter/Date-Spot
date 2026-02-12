// src/screens/styles.ts
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  topOverlay: {
    position: "absolute",
    left: 10,
    right: 10,
    zIndex: 10,
    elevation: 10,
  },
  searchBar: {
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  searchInput: {
    padding: 0,
    fontSize: 14,
  },

  suggestionsWrapper: {
    marginTop: 4,
    maxHeight: 160,
    borderRadius: 8,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestions: {
    maxHeight: 160,
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  suggestionText: {
    fontSize: 14,
  },
  suggestionSubText: {
    fontSize: 11,
    color: "#777",
    marginTop: 2,
  },
  searchingText: {
    fontSize: 12,
    color: "#777",
  },

  addPinButton: {
    marginTop: 8,
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addPinText: {
    fontWeight: "600",
  },

  bottomSheet: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "white",
  padding: 16,
  zIndex: 1000,
  elevation: 20,
},

  sheetTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  row: {
    flexDirection: "row",
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  cancelButton: {
    marginRight: 8,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  saveButton: {
    borderColor: "#007bff",
    backgroundColor: "#007bff",
  },
  cancelText: {
    color: "#333",
  },
  saveText: {
    color: "#fff",
    fontWeight: "600",
  },
  tagPeopleSection: {
    marginTop: 10,
    marginBottom: 6,
  },
  tagPeopleHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tagPeopleTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  tagPeopleSubtext: {
    marginTop: 2,
    fontSize: 12,
    color: "#666",
  },
  tagPeopleAddBtn: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#fff",
  },
  tagPeopleAddBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111",
  },
  tagPeopleChipsWrap: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagPeopleEmpty: {
    marginTop: 8,
    fontSize: 12,
    color: "#777",
  },
  taggedChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e8e8e8",
    borderRadius: 999,
    backgroundColor: "#fff",
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 6,
  },
  taggedChipText: {
    fontSize: 12,
    color: "#111",
    marginRight: 6,
  },
  taggedChipRemoveBtn: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 999,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
  },
  taggedChipRemoveText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#555",
    lineHeight: 12,
  },
  tagPickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  tagPickerCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    width: "100%",
    maxWidth: 420,
    maxHeight: "70%",
  },
  tagPickerHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  tagPickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  tagPickerClose: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  tagPickerList: {
    marginTop: 8,
  },
  tagPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tagPickerRowSelected: {
    backgroundColor: "#f7f9fc",
  },
  tagPickerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
  },
  tagPickerTextWrap: {
    flex: 1,
  },
  tagPickerUsername: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
  },
  tagPickerName: {
    fontSize: 12,
    color: "#666",
    marginTop: 1,
  },
  tagPickerCheck: {
    fontSize: 12,
    color: "#111",
    fontWeight: "700",
  },
  tagPickerLoading: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  tagPickerEmpty: {
    textAlign: "center",
    fontSize: 12,
    color: "#666",
    paddingVertical: 16,
  },

  pinGuideOverlay: {
  position: "absolute",
  top: 50,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 999,     // was 5
  elevation: 999,  // android
},

  pinGuideDim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 5,
  },

  pinGuideCard: {
    position: "absolute",
    top: -20,
    left: 20,
    right: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: "rgba(20,20,20,0.95)",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 6,
  },

  pinGuideTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },

  pinGuideText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 15,
    lineHeight: 22,
  },

  pinGuideActions: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 6,
  },

  pinGuideCancel: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  pinGuideCancelText: {
    color: "#111",
    fontWeight: "800",
    fontSize: 16,
  },

  pinGuideNext: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  pinGuideNextText: {
    color: "#111",
    fontWeight: "800",
    fontSize: 16,
  },

profileIconButton: {
  width: 36,
  height: 36,
  borderRadius: 18,
  overflow: "hidden",
},

profileIconImage: {
  width: 36,
  height: 36,
},


});

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
    minHeight: 50,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E7E7E7",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    paddingVertical: 12,
    fontSize: 15,
    color: "#191919",
  },

  actionRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  actionRowSpacer: {
    flex: 1,
    minHeight: 50,
  },
  activeFiltersLabel: {
    marginTop: 6,
    alignSelf: "flex-end",
    fontSize: 12,
    fontWeight: "700",
    color: "#A31538",
    backgroundColor: "#FFF1F5",
    borderWidth: 1,
    borderColor: "#F8CAD7",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  filtersButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E7E7",
    borderRadius: 12,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  filtersButtonActive: {
    borderColor: "#E21E4D",
    backgroundColor: "#E21E4D",
  },
  filtersButtonIcon: {
    marginRight: 6,
  },
  filtersButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1D1D1D",
  },
  filtersButtonTextActive: {
    color: "#FFFFFF",
  },
  filtersActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    marginLeft: 6,
  },

  suggestionsWrapper: {
    marginTop: 4,
    maxHeight: 220,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E7E7",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  suggestions: {
    maxHeight: 220,
  },
  suggestionItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  suggestionTextWrap: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 15,
    color: "#1D1D1D",
  },
  suggestionSubText: {
    fontSize: 12,
    color: "#8A8A8A",
    marginTop: 3,
  },
  suggestionIconPill: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#F3CAD5",
    backgroundColor: "#FFF1F5",
    alignItems: "center",
    justifyContent: "center",
  },
  searchingText: {
    fontSize: 13,
    color: "#8A8A8A",
  },

  addPinButton: {
    backgroundColor: "#E21E4D",
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E21E4D",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  addPinText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
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

  pinGuideOverlay: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 999,
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

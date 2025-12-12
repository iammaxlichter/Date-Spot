// src/screens/styles.ts
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  topOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    zIndex: 10,
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

  // Wrapper so we can clip + shadow the scrollable list
  suggestionsWrapper: {
    marginTop: 4,
    maxHeight: 160, // ~3 items tall
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

  // Bottom sheet (used by NewSpotSheet)
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "white",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
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
});

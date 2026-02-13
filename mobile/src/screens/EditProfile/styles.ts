import { StyleSheet } from "react-native";

export const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 120,
  },
  avatarWrap: {
    alignItems: "center",
    marginBottom: 18,
  },
  avatarPressable: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: "hidden",
    marginBottom: 8,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarHint: {
    fontSize: 12,
    color: "#666",
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: "#444",
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#111",
    backgroundColor: "#fff",
  },
  inputReadOnly: {
    backgroundColor: "#f6f6f6",
    color: "#666",
  },
  inputError: {
    borderColor: "#c62222",
  },
  errorText: {
    fontSize: 12,
    color: "#c62222",
    marginTop: 5,
  },
  helperText: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  banner: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  bannerError: {
    backgroundColor: "#fff2f2",
    borderWidth: 1,
    borderColor: "#ffd6d6",
  },
  bannerSuccess: {
    backgroundColor: "#f2fff5",
    borderWidth: 1,
    borderColor: "#d8ffe2",
  },
  bannerText: {
    fontSize: 13,
    color: "#111",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  saveButton: {
    alignSelf: "flex-end",
    minWidth: 110,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#111",
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});

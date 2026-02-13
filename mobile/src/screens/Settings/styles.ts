import { StyleSheet } from "react-native";

export const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  button: {
    borderWidth: 1,
    borderColor: "#e6e6e6",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  dangerButton: {
    borderColor: "#ffd5d9",
    backgroundColor: "#fff7f8",
  },
  dangerButtonText: {
    color: "#be1622",
  },
});

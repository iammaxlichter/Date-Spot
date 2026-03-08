// src/screens/Login/styles.ts
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  brandWrap: {
    alignItems: "center",
    marginBottom: 26,
    transform: [{ translateY: -100 }],
  },
  logo: {
    width: 98,
    height: 98,
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "800",
    color: "#D91B46",
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E6E6E6",
    color: "#191919",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#E21E4D",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  googleButton: {
    marginTop: 10,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E6E6E6",
    backgroundColor: "#FFFFFF",
  },
  googleButtonText: {
    color: "#222222",
    fontSize: 15,
    fontWeight: "600",
  },
  link: {
    marginTop: 14,
    color: "#D91B46",
    fontWeight: "600",
    textAlign: "center",
  },
});

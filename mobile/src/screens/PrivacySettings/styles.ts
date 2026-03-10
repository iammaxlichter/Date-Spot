import { StyleSheet } from "react-native";

export const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: "flex-start",
    marginTop: 4,
    marginBottom: 32,
  },
  hero: {
    marginBottom: 20,
  },
  eyebrow: {
    color: "#D91B46",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    fontSize: 31,
    lineHeight: 35,
    fontWeight: "800",
    color: "#1D1D1D",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#616161",
  },
  card: {
    borderWidth: 1,
    borderColor: "#EFEFEF",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1D1D1D",
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    color: "#616161",
  },
});

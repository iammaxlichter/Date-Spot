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
    marginBottom: 64,
  },
  hero: {
    marginBottom: 24,
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
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#F2F2F2",
    marginHorizontal: 20,
  },
  rowText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1D1D1D",
  },
  rowTextDanger: {
    color: "#D91B46",
  },
  rowChevron: {
    fontSize: 15,
    color: "#C8C8C8",
  },
});

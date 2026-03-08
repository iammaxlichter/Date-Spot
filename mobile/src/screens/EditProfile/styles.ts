import { StyleSheet } from "react-native";

export const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    alignSelf: "flex-start",
    marginTop: 4,
    marginBottom: 32,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 128,
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
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#232323",
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#7A7A7A",
    marginBottom: 12,
  },
  avatarWrap: {
    alignItems: "center",
    marginBottom: 0,
  },
  avatarPressable: {
    width: 118,
    height: 118,
    borderRadius: 59,
    overflow: "hidden",
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "#FDE7ED",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarHint: {
    fontSize: 13,
    color: "#616161",
    fontWeight: "500",
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    color: "#3C3C3C",
    marginBottom: 7,
    fontWeight: "600",
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#E7E7E7",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#191919",
    backgroundColor: "#FFFFFF",
  },
  inputReadOnly: {
    backgroundColor: "#F7F7F7",
    color: "#707070",
  },
  inputError: {
    borderColor: "#C62828",
  },
  errorText: {
    fontSize: 12,
    color: "#C62828",
    marginTop: 5,
  },
  helperText: {
    fontSize: 12,
    color: "#6D6D6D",
    marginTop: 5,
  },
  banner: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 14,
  },
  bannerError: {
    backgroundColor: "#FFF2F2",
    borderWidth: 1,
    borderColor: "#FFDADA",
  },
  bannerSuccess: {
    backgroundColor: "#F2FFF6",
    borderWidth: 1,
    borderColor: "#D8FFE3",
  },
  bannerText: {
    fontSize: 13,
    color: "#212121",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: "#EFEFEF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  saveButton: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#E21E4D",
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.55,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});


import { Platform, StyleSheet } from "react-native";

export default StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(9, 6, 10, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  card: {
    width: "100%",
    maxWidth: 280,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 24,
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 18
    },
    shadowOpacity: Platform.OS === "ios" ? 0.16 : 0.26,
    shadowRadius: 22,
    elevation: 14
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: {
      width: 0,
      height: 8
    },
    shadowOpacity: 0.26,
    shadowRadius: 12,
    elevation: 12,
    marginBottom: 16
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26,
    textAlign: "center",
    marginBottom: 20
  },
  message: {
    width: "100%",
    minHeight: 40,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24
  },
  actions: {
    width: "100%",
    gap: 10
  },
  actionsMulti: {
    flexDirection: "row",
    gap: 12
  },
  actionsStacked: {
    gap: 10
  },
  actionButton: {
    minHeight: 44,
    borderRadius: 7,
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14
  },
  actionButtonMulti: {
    flex: 1
  },
  actionButtonStacked: {
    width: "100%"
  },
  actionText: {
    fontSize: 15,
    fontWeight: "900"
  },
  primaryText: {
    color: "#FFFFFF"
  },
  buttonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }]
  }
});

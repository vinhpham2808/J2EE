import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../constants/colors";
import { scale, clampScale } from "../utils/dimensions";

export default function Loader({ text = "Đang xử lý...", fullScreen = false, overlay = false }) {
  const isBlocking = fullScreen || overlay;
  
  return (
    <View
      style={[styles.wrapper, fullScreen && styles.fullScreen, overlay && styles.overlay]}
      pointerEvents={isBlocking ? "auto" : "box-none"}
      accessibilityViewIsModal={isBlocking}
      importantForAccessibility={isBlocking ? "yes" : "auto"}
    >
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20)
  },
  fullScreen: {
    flex: 1,
    backgroundColor: COLORS.DARK_BG
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.OVERLAY,
    zIndex: 999
  },
  container: {
    backgroundColor: COLORS.DARK_CARD_SOLID,
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: COLORS.DARK_BORDER,
    paddingVertical: scale(24),
    paddingHorizontal: scale(32),
    alignItems: "center",
    gap: scale(12)
  },
  text: {
    color: COLORS.DARK_TEXT,
    fontSize: clampScale(14, 12, 16),
    fontWeight: "600",
    textAlign: "center"
  }
});

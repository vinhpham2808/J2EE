import React from "react";
import { Platform, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";

/**
 * Reusable card-style header for app screens.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {'light'|'dark'|'chat'} [props.theme='light']
 * @param {React.ReactNode} [props.rightElement]
 * @param {boolean} [props.safeAreaTop=true]
 */
export default function ScreenHeader({
  title,
  theme = "light",
  rightElement,
  safeAreaTop = true,
}) {
  const insets = useSafeAreaInsets();
  const colors = THEME_COLORS[theme] || THEME_COLORS.light;
  const statusBarTop = Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;
  const topInset = Math.max(insets.top, statusBarTop);
  const headerGap = 8;
  const safeTopPadding = safeAreaTop ? Math.max(topInset - 16 + headerGap, 0) : 0;

  return (
    <View style={[styles.safeWrap, { paddingTop: safeTopPadding }]}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.card,
            borderLeftColor: colors.accent,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.title }]} numberOfLines={1}>
          {title}
        </Text>

        {rightElement ? (
          <View style={styles.rightSlot}>
            {rightElement}
          </View>
        ) : (
          <HeaderAccent color={colors.accent} />
        )}
      </View>
    </View>
  );
}

function HeaderAccent({ color }) {
  return (
    <View
      style={styles.accentWrap}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.accentDot, styles.accentDotTop, { backgroundColor: color }]} />
      <View style={[styles.accentDot, styles.accentDotRight, { backgroundColor: color }]} />
      <View style={[styles.accentDot, styles.accentDotBottom, { backgroundColor: color }]} />
      <View style={[styles.accentDot, styles.accentDotLeft, { backgroundColor: color }]} />
    </View>
  );
}

const THEME_COLORS = {
  light: {
    card: COLORS.CARD,
    title: COLORS.TEXT,
    accent: COLORS.PRIMARY,
    shadow: COLORS.BLACK,
  },
  dark: {
    card: COLORS.DARK_CARD_SOLID,
    title: COLORS.DARK_TEXT,
    accent: COLORS.PRIMARY_LIGHT,
    shadow: COLORS.BLACK,
  },
  chat: {
    card: COLORS.CHAT_BUBBLE,
    title: COLORS.CHAT_TEXT,
    accent: COLORS.CHAT_PINK,
    shadow: COLORS.CHAT_PURPLE,
  },
};

const styles = StyleSheet.create({
  safeWrap: {
    width: "100%",
  },
  container: {
    minHeight: 42,
    borderRadius: 6,
    borderLeftWidth: 1.5,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    shadowOpacity: 0.14,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "left",
  },
  rightSlot: {
    flexShrink: 0,
    marginLeft: 12,
  },
  accentWrap: {
    width: 18,
    height: 18,
    marginLeft: 12,
    position: "relative",
  },
  accentDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    position: "absolute",
  },
  accentDotTop: {
    top: 3,
    left: 8,
  },
  accentDotRight: {
    top: 8,
    right: 3,
  },
  accentDotBottom: {
    bottom: 3,
    left: 8,
  },
  accentDotLeft: {
    top: 8,
    left: 3,
  },
});

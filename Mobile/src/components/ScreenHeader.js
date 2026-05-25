import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../constants/colors";

/**
 * ScreenHeader – Reusable header component for all screens.
 *
 * @param {object} props
 * @param {string} props.title          – Title text displayed in the header.
 * @param {'light'|'dark'|'chat'} [props.theme='light']
 *                                      – Color theme: 'light' (main app), 'dark' (auth), 'chat' (chatbot).
 * @param {()=>void} [props.onBack]     – Custom back handler. Defaults to navigation.goBack().
 * @param {boolean} [props.showBack=true] – Whether to show the back arrow.
 * @param {React.ReactNode} [props.rightElement] – Optional element rendered on the right side.
 */
export default function ScreenHeader({
  title,
  theme = "light",
  onBack,
  showBack = true,
  rightElement,
}) {
  const navigation = useNavigation();

  const colors = THEME_COLORS[theme] || THEME_COLORS.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* ── Left: back arrow ── */}
      <View style={styles.leftSlot}>
        {showBack ? (
          <Pressable
            style={[styles.backBtn, { backgroundColor: colors.btnBg }]}
            onPress={onBack || (() => navigation.goBack())}
            android_ripple={colors.ripple ? { color: colors.ripple, borderless: true, radius: 22 } : null}
          >
            <Text style={[styles.backArrow, { color: colors.icon }]}>←</Text>
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {/* ── Center: title ── */}
      <Text style={[styles.title, { color: colors.title }]} numberOfLines={1}>
        {title}
      </Text>

      {/* ── Right: custom element ── */}
      <View style={styles.rightSlot}>
        {rightElement || <View style={styles.placeholder} />}
      </View>
    </View>
  );
}

// ─── Theme definitions ──────────────────────────────────────
const THEME_COLORS = {
  light: {
    bg: COLORS.TRANSPARENT,
    title: COLORS.TEXT,
    icon: COLORS.PRIMARY,
    btnBg: COLORS.ROSE_MIST,
  },
  dark: {
    bg: COLORS.TRANSPARENT,
    title: COLORS.DARK_TEXT,
    icon: COLORS.DARK_TEXT,
    btnBg: COLORS.TRANSPARENT,
  },
  chat: {
    bg: COLORS.TRANSPARENT,
    title: COLORS.CHAT_TEXT,
    icon: COLORS.CHAT_PURPLE,
    btnBg: COLORS.TRANSPARENT,
    ripple: COLORS.CHAT_PURPLE_LIGHT,
  },
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  leftSlot: {
    width: 52,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  rightSlot: {
    width: 52,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    fontSize: 22,
    fontWeight: "600",
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  placeholder: {
    width: 44,
    height: 44,
  },
});

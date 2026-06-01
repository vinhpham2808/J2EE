import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";
import { getSafeAreaTop } from "../utils/safeAreaSpacing";

export default function HomeTopHeader({ onMenuPress, onBellPress, unreadCount = 0 }) {
  const insets = useSafeAreaInsets();
  const displayCount = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <View style={[styles.container, { paddingTop: getSafeAreaTop(insets, 8) }]}>
      <Pressable style={styles.iconButton} onPress={onMenuPress}>
        <Text style={styles.iconText}>☰</Text>
      </Pressable>

      <Text style={styles.title}>Trang chủ</Text>

      <Pressable style={styles.iconButton} onPress={onBellPress}>
        <Text style={styles.iconText}>🔔</Text>
        {unreadCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{displayCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 8
  },
  title: {
    color: COLORS.PRIMARY,
    fontSize: 23,
    fontWeight: "800",
    flex: 1,
    textAlign: "center"
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.ROSE_MIST,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER
  },
  iconText: {
    fontSize: 18
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.EXPENSE,
    borderWidth: 2,
    borderColor: COLORS.CARD
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 9,
    fontWeight: "900"
  }
});

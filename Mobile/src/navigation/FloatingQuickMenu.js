import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppColors } from "../constants/colors";
import AppIcon from "../components/ui/AppIcon";

const SUB_ACTIONS = [
  {
    key: "Income",
    iconSource: require("../assets/income/income.png"),
    label: "Thu nhập",
    color: "#22C55E",
    gradient: ["#22C55E", "#16A34A"],
  },
  {
    key: "Expense",
    iconSource: require("../assets/expense/expenses.png"),
    label: "Chi tiêu",
    color: "#F97316",
    gradient: ["#FB923C", "#F97316"],
  },
  {
    key: "Forecast",
    iconSource: require("../assets/ai-insight/forecast-analytics.png"),
    label: "Dự báo",
    color: "#26A69A",
    gradient: ["#2DD4BF", "#0F766E"],
  },
  {
    key: "Budget",
    iconSource: require("../assets/accessories/budget.png"),
    label: "Ngân sách",
    color: "#A855F7",
    gradient: ["#A855F7", "#7C3AED"],
  },
  {
    key: "Chat",
    iconSource: require("../assets/ai-insight/robot.png"),
    label: "Chat AI",
    color: "#7C4DFF",
    gradient: ["#8B5CF6", "#6D22E8"],
  },
];

export function FloatingTabButton({ onPress, isOpen }) {
  const colors = useAppColors();
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isOpen, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "135deg"],
  });

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Mở menu nhanh">
      <LinearGradient
        colors={["#7C4DFF", "#A855F7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.fabMain, { shadowColor: "#7C4DFF" }]}
      >
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <AppIcon name="add" size={28} color={colors.WHITE || "#FFFFFF"} />
        </Animated.View>
      </LinearGradient>
    </Pressable>
  );
}

export default function FloatingQuickMenu({ visible, onClose, onSelectRoute, focusedKey }) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const dockTranslateY = useRef(new Animated.Value(18)).current;
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const isDark = colors.BG === "#0F0D0C";
  const [active, setActive] = useState(false);

  const animations = useRef(
    SUB_ACTIONS.map(() => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      setActive(true);

      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(dockTranslateY, {
          toValue: 0,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.stagger(
          34,
          animations.map((anim, index) =>
            Animated.parallel([
              Animated.spring(anim.scale, {
                toValue: 1,
                friction: 7,
                tension: 90 + index * 5,
                useNativeDriver: true,
              }),
              Animated.timing(anim.opacity, {
                toValue: 1,
                duration: 180,
                useNativeDriver: true,
              }),
            ])
          )
        ),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(dockTranslateY, {
          toValue: 18,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.stagger(
          24,
          animations.map((anim) =>
            Animated.parallel([
              Animated.timing(anim.scale, {
                toValue: 0,
                duration: 170,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: 140,
                useNativeDriver: true,
              }),
            ])
          )
        ),
      ]).start(() => {
        setActive(false);
      });
    }
  }, [animations, dockTranslateY, overlayOpacity, visible]);

  if (!visible && !active) return null;

  const dockBottomOffset = Math.max(insets.bottom, 8) + 92;
  const inactiveActionBackground = isDark ? "rgba(255,255,255,0.055)" : "#FFF9FB";

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: overlayOpacity,
            backgroundColor: isDark ? "rgba(0, 0, 0, 0.58)" : "rgba(15, 23, 42, 0.34)",
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Animated.View
          pointerEvents="auto"
          style={[
            styles.quickDock,
            {
              bottom: dockBottomOffset,
              backgroundColor: isDark ? "rgba(31, 27, 25, 0.96)" : "rgba(255, 255, 255, 0.98)",
              borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(239, 226, 230, 0.95)",
              shadowColor: colors.SHADOW_COLOR || "#000",
              opacity: overlayOpacity,
              transform: [{ translateY: dockTranslateY }],
            },
          ]}
        >
          <View style={styles.actionRow}>
            {SUB_ACTIONS.map((action, index) => {
              const anim = animations[index];
              const isFocused = focusedKey === action.key;
              const actionBackground = isFocused ? `${action.color}18` : inactiveActionBackground;
              const actionBorderColor = isFocused ? action.color : isDark ? "rgba(255,255,255,0.14)" : "rgba(239,94,131,0.18)";
              const actionLabelColor = isFocused ? action.color : colors.TEXT;

              return (
                <Animated.View
                  key={action.key}
                  style={[
                    styles.actionSlot,
                    {
                      opacity: anim.opacity,
                      transform: [{ scale: anim.scale }],
                    },
                  ]}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Mở ${action.label}`}
                    style={({ pressed }) => [
                      styles.actionCard,
                      {
                        backgroundColor: actionBackground,
                        borderColor: actionBorderColor,
                      },
                      pressed && { opacity: 0.82, transform: [{ translateY: 1 }] },
                    ]}
                    onPress={() => onSelectRoute(action.key)}
                  >
                    <LinearGradient
                      colors={action.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.actionIcon, { shadowColor: action.color }]}
                    >
                      <Image source={action.iconSource} style={styles.actionIconImage} resizeMode="contain" />
                    </LinearGradient>
                    <Text
                      style={[styles.actionLabel, { color: actionLabelColor }]}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      minimumFontScale={0.78}
                    >
                      {action.label}
                    </Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fabMain: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -22,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    alignSelf: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  quickDock: {
    position: "absolute",
    left: 18,
    right: 18,
    borderRadius: 28,
    borderWidth: 1,
    padding: 12,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 14,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionSlot: {
    flex: 1,
  },
  actionCard: {
    minHeight: 82,
    borderRadius: 20,
    borderWidth: 1.2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    paddingVertical: 8,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },
  actionIconImage: {
    width: 24,
    height: 24
  },
  actionLabel: {
    marginTop: 7,
    width: "100%",
    minHeight: 24,
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 12,
    textAlign: "center",
  },
});

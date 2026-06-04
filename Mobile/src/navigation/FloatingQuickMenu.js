import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppColors } from "../constants/colors";

// ─── Speed Dial sub-actions ──────────────────────────────
const SUB_ACTIONS = [
  {
    key: "Income",
    icon: "💰",
    label: "Thêm thu nhập",
    tx: -160,
    ty: -80,
    color: "#43A047",
  },
  {
    key: "Budget",
    icon: "🎯",
    label: "Ngân sách",
    tx: -80,
    ty: -125,
    color: "#7E57C2",
  },
  {
    key: "Forecast",
    icon: "🔮",
    label: "Dự báo",
    tx: 0,
    ty: -148,
    color: "#26A69A",
  },
  {
    key: "Goal",
    icon: "🎯",
    label: "Thêm mục tiêu",
    tx: 80,
    ty: -125,
    color: "#E53935",
  },
  {
    key: "Chat",
    icon: "🤖",
    label: "Chat AI",
    tx: 160,
    ty: -80,
    color: "#8E24AA",
  },
];

// ─── FAB button (inside tab bar) ─────────────────────────
export function FloatingTabButton({ onPress, isOpen }) {
  const colors = useAppColors();
  return (
    <Pressable
      style={[
        styles.fabMain,
        {
          backgroundColor: colors.PRIMARY,
          shadowColor: colors.PRIMARY,
        },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.fabMainIcon, { color: colors.DARK_TEXT }]}>{isOpen ? "✕" : "＋"}</Text>
    </Pressable>
  );
}

// ─── Speed Dial overlay + sub-buttons ────────────────────
export default function FloatingQuickMenu({ visible, onClose, onSelectRoute, focusedKey }) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const colors = useAppColors();

  // one animated value set per sub-button
  const animations = useRef(
    SUB_ACTIONS.map(() => ({
      tx: new Animated.Value(0),
      ty: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      const fanOut = animations.map((anim, i) => {
        const delay = i * 60;
        return Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.spring(anim.tx, {
              toValue: SUB_ACTIONS[i].tx,
              friction: 6,
              tension: 100,
              useNativeDriver: true,
            }),
            Animated.spring(anim.ty, {
              toValue: SUB_ACTIONS[i].ty,
              friction: 6,
              tension: 100,
              useNativeDriver: true,
            }),
            Animated.spring(anim.scale, {
              toValue: 1,
              friction: 6,
              tension: 100,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: 180,
              useNativeDriver: true,
            }),
          ]),
        ]);
      });

      Animated.parallel(fanOut).start();
    } else {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();

      animations.forEach((anim) => {
        anim.tx.setValue(0);
        anim.ty.setValue(0);
        anim.scale.setValue(0);
        anim.opacity.setValue(0);
      });
    }
  }, [visible, overlayOpacity, animations]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Semi-transparent backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Safe area for interactive floating buttons */}
      <View
        style={[
          styles.safeArea,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
        pointerEvents="box-none"
      >
        {/* Sub-buttons anchored at center-bottom, above tab bar */}
        <View style={styles.subButtonsContainer} pointerEvents="box-none">
        {SUB_ACTIONS.map((action, i) => {
          const anim = animations[i];
          return (
            <Animated.View
              key={action.key}
              style={[
                styles.subButtonWrapper,
                {
                  transform: [
                    { translateX: anim.tx },
                    { translateY: anim.ty },
                    { scale: anim.scale },
                  ],
                  opacity: anim.opacity,
                },
              ]}
            >
              <Pressable
                style={[
                  styles.subButton,
                  styles[`blob${i}`],
                  { backgroundColor: action.color },
                  focusedKey === action.key && styles.subButtonFocused,
                ]}
                onPress={() => onSelectRoute(action.key)}
              >
                <Text style={styles.subIcon}>{action.icon}</Text>
              </Pressable>
              <View style={[styles.labelBubble, { backgroundColor: colors.CARD }, focusedKey === action.key && styles.labelBubbleFocused]}>
                <Text
                  style={[styles.subLabel, { color: colors.TEXT }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                  allowFontScaling={false}
                >
                  {action.label}
                </Text>
              </View>
            </Animated.View>
          );
        })}
      </View>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── Main FAB ──────────────────────────────────────────
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
  fabMainIcon: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: -1,
  },

  // ── Backdrop ──────────────────────────────────────────
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },

  // ── Safe area wrapper ─────────────────────────────────
  safeArea: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "center",
  },

  // ── Sub-buttons area ──────────────────────────────────
  subButtonsContainer: {
    position: "absolute",
    bottom: 72,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  subButtonWrapper: {
    position: "absolute",
    alignItems: "center",
  },

  // ── Blob / organic shaped buttons ─────────────────────
  subButton: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 6,
  },
  blob0: {
    borderRadius: 40,
    borderTopLeftRadius: 46,
    borderBottomRightRadius: 32,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 44,
  },
  blob1: {
    borderRadius: 38,
    borderTopLeftRadius: 28,
    borderBottomRightRadius: 46,
    borderTopRightRadius: 44,
    borderBottomLeftRadius: 30,
  },
  blob2: {
    borderRadius: 42,
    borderTopLeftRadius: 44,
    borderBottomRightRadius: 28,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 46,
  },
  blob3: {
    borderRadius: 36,
    borderTopLeftRadius: 30,
    borderBottomRightRadius: 48,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 28,
  },
  blob4: {
    borderRadius: 44,
    borderTopLeftRadius: 32,
    borderBottomRightRadius: 40,
    borderTopRightRadius: 46,
    borderBottomLeftRadius: 34,
  },
  blob5: {
    borderRadius: 34,
    borderTopLeftRadius: 42,
    borderBottomRightRadius: 34,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 46,
  },

  subIcon: {
    fontSize: 24,
  },

  labelBubble: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },

  subLabel: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },

  // ── Focused sub-action ────────────────────────────────
  subButtonFocused: {
    borderWidth: 3,
    borderColor: "#FFF",
    transform: [{ scale: 1.1 }],
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  labelBubbleFocused: {
    backgroundColor: "#ef5e83",
  },
});

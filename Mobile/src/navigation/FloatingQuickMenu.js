import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { COLORS } from "../constants/colors";

// ─── Speed Dial sub-actions ──────────────────────────────
const SUB_ACTIONS = [
  {
    key: "Income",
    icon: "💰",
    label: "Add Income",
    tx: -128,
    ty: -88,
    color: "#43A047",
  },
  {
    key: "Budget",
    icon: "🎯",
    label: "Budget",
    tx: -64,
    ty: -125,
    color: "#7E57C2",
  },
  {
    key: "Forecast",
    icon: "🔮",
    label: "Forecast",
    tx: 0,
    ty: -142,
    color: "#26A69A",
  },
  {
    key: "AddExpense",
    icon: "💸",
    label: "Add Expense",
    tx: 64,
    ty: -125,
    color: "#E53935",
  },
  {
    key: "Chat",
    icon: "🤖",
    label: "AI Chat",
    tx: 128,
    ty: -88,
    color: "#8E24AA",
  },
];

// ─── FAB button (inside tab bar) ─────────────────────────
export function FloatingTabButton({ onPress, isOpen }) {
  return (
    <Pressable style={styles.fabMain} onPress={onPress}>
      <Text style={styles.fabMainIcon}>{isOpen ? "✕" : "＋"}</Text>
    </Pressable>
  );
}

// ─── Speed Dial overlay + sub-buttons ────────────────────
export default function FloatingQuickMenu({ visible, onClose, onSelectRoute }) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;

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
                ]}
                onPress={() => onSelectRoute(action.key)}
              >
                <Text style={styles.subIcon}>{action.icon}</Text>
              </Pressable>
              <Text style={styles.subLabel}>{action.label}</Text>
            </Animated.View>
          );
        })}
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
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -22,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    alignSelf: "center",
  },
  fabMainIcon: {
    color: COLORS.DARK_TEXT,
    fontSize: 22,
    fontWeight: "700",
    marginTop: -1,
  },

  // ── Backdrop ──────────────────────────────────────────
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
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
    shadowOffset: { width: 0, height: 4 },
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

 subLabel: {
  width: 82,
  color: "#FFF",
  fontSize: 11,
  fontWeight: "600",
  marginTop: 8,
  textAlign: "center",
  textShadowColor: "rgba(0,0,0,0.3)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
},
});
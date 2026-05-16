import React, { useContext } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AuthContext } from "../../../components/AuthContext";
import { COLORS } from "../../../constants/colors";

/**
 * Small AI Insight icon button placed next to section headers.
 *
 * Visual:
 *   Background: ROSE_MIST (#FFE4EA)
 *   Icon color: PRIMARY (#E8597A)
 *   Icon: ✨
 *
 * When tapped:
 *   - Premium user → opens the AI Insight Bottom Sheet
 *   - Free/Basic user → opens the Locked Feature Modal
 */
export default function AiInsightButton({ onPress, style }) {
  const { user } = useContext(AuthContext);
  const plan = String(user?.subscriptionPlan || "FREE").toUpperCase();
  const isPremium = plan === "PREMIUM";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        style,
        pressed && styles.buttonPressed,
      ]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={styles.icon}>✨</Text>
      <View style={styles.labelWrap}>
        <Text style={styles.label}>AI</Text>
        {isPremium && <View style={styles.proDot} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.ROSE_MIST,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  icon: {
    fontSize: 14,
    marginRight: 4,
  },
  labelWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    color: COLORS.PRIMARY,
    fontSize: 12,
    fontWeight: "800",
  },
  proDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.GOLD,
    marginLeft: 3,
  },
});

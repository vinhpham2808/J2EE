import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";

export default function CategoryTypeSegmentedControl({ value, onChange }) {
  const colors = useAppColors();
  const typeAnim = useRef(new Animated.Value(value === "expense" ? 1 : 0)).current;
  const [width, setWidth] = useState(0);
  const segmentWidth = width > 0 ? (width - 8) / 2 : 0;
  const incomeColor = colors.ACTION_INCOME || colors.INCOME || "#22C55E";
  const expenseColor = colors.ACTION_EXPENSE || colors.EXPENSE || colors.PRIMARY || "#F97316";

  useEffect(() => {
    typeAnim.stopAnimation();
    Animated.timing(typeAnim, {
      toValue: value === "expense" ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false
    }).start();
  }, [typeAnim, value]);

  const indicatorTranslateX = typeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, segmentWidth]
  });
  const indicatorColor = typeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [incomeColor, expenseColor]
  });
  const borderColor = typeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [incomeColor, expenseColor]
  });
  const incomeTextColor = typeAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [colors.WHITE || "#FFFFFF", colors.TEXT_SECONDARY, colors.TEXT_SECONDARY]
  });
  const expenseTextColor = typeAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [colors.TEXT_SECONDARY, colors.TEXT_SECONDARY, colors.WHITE || "#FFFFFF"]
  });
  const incomeScale = typeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.04, 1]
  });
  const expenseScale = typeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04]
  });

  return (
    <Animated.View style={[styles.typeRow, { backgroundColor: colors.BG, borderColor }]} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {segmentWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.typeActiveIndicator,
            {
              width: segmentWidth,
              backgroundColor: indicatorColor,
              shadowColor: value === "expense" ? expenseColor : incomeColor,
              transform: [{ translateX: indicatorTranslateX }]
            }
          ]}
        />
      ) : null}

      <Pressable style={styles.typeButton} onPress={() => onChange("income")}>
        <Animated.Text style={[styles.typeText, { color: incomeTextColor, transform: [{ scale: incomeScale }] }]}>Thu nhập</Animated.Text>
      </Pressable>
      <Pressable style={styles.typeButton} onPress={() => onChange("expense")}>
        <Animated.Text style={[styles.typeText, { color: expenseTextColor, transform: [{ scale: expenseScale }] }]}>Chi tiêu</Animated.Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  typeRow: {
    flexDirection: "row",
    backgroundColor: "#F5F5F7",
    borderWidth: 1.5,
    borderColor: "#EA5A7A",
    borderRadius: 16,
    padding: 4,
    marginBottom: 8,
    position: "relative"
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "transparent",
    alignItems: "center",
    zIndex: 2
  },
  typeActiveIndicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 12,
    backgroundColor: "#EA5A7A",
    shadowColor: "#EA5A7A",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
    zIndex: 1
  },
  typeText: {
    color: "#667085",
    fontWeight: "700"
  },
  typeTextActive: {
    color: COLORS.WHITE
  }
});

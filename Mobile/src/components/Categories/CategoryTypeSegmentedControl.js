import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";

export default function CategoryTypeSegmentedControl({ value, onChange }) {
  const colors = useAppColors();
  const slideAnim = useRef(new Animated.Value(value === "expense" ? 1 : 0)).current;
  const thumbScaleAnim = useRef(new Animated.Value(1)).current;
  const [width, setWidth] = useState(0);
  const segmentWidth = width > 0 ? (width - 8) / 2 : 0;

  useEffect(() => {
    slideAnim.stopAnimation();
    thumbScaleAnim.stopAnimation();

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: value === "expense" ? 1 : 0,
        friction: 8,
        tension: 120,
        useNativeDriver: true
      }),
      Animated.sequence([
        Animated.timing(thumbScaleAnim, {
          toValue: 0.96,
          duration: 80,
          useNativeDriver: true
        }),
        Animated.spring(thumbScaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 160,
          useNativeDriver: true
        })
      ])
    ]).start();
  }, [slideAnim, thumbScaleAnim, value]);

  const indicatorTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, segmentWidth]
  });

  return (
    <View style={[styles.typeRow, { backgroundColor: colors.BG, borderColor: colors.PRIMARY }]} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {segmentWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.typeActiveIndicator,
            {
              width: segmentWidth,
              backgroundColor: colors.PRIMARY,
              shadowColor: colors.PRIMARY,
              transform: [{ translateX: indicatorTranslateX }, { scale: thumbScaleAnim }]
            }
          ]}
        />
      ) : null}

      <Pressable style={styles.typeButton} onPress={() => onChange("income")}>
        <Text style={[styles.typeText, { color: value === "income" ? colors.WHITE : colors.TEXT_SECONDARY }]}>Thu nhập</Text>
      </Pressable>
      <Pressable style={styles.typeButton} onPress={() => onChange("expense")}>
        <Text style={[styles.typeText, { color: value === "expense" ? colors.WHITE : colors.TEXT_SECONDARY }]}>Chi tiêu</Text>
      </Pressable>
    </View>
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

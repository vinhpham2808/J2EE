import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";

export function useVisibleItems(items, options = {}) {
  const {
    initialCount = 3,
    step = initialCount,
    mode = "toggle",
    resetKey
  } = options;

  const sourceItems = Array.isArray(items) ? items : [];
  const [expanded, setExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(initialCount);

  useEffect(() => {
    setExpanded(false);
    setVisibleCount(initialCount);
  }, [initialCount, resetKey]);

  const visibleItems = useMemo(() => {
    if (mode === "toggle") {
      return expanded ? sourceItems : sourceItems.slice(0, initialCount);
    }

    return sourceItems.slice(0, visibleCount);
  }, [expanded, initialCount, mode, sourceItems, visibleCount]);

  const canToggle = sourceItems.length > initialCount;
  const canShowMore = visibleItems.length < sourceItems.length;

  const toggle = useCallback(() => {
    setExpanded((current) => !current);
  }, []);

  const showMore = useCallback(() => {
    setVisibleCount((current) => Math.min(current + step, sourceItems.length));
  }, [sourceItems.length, step]);

  return {
    visibleItems,
    canToggle,
    canShowMore,
    expanded,
    toggle,
    showMore
  };
}

export default function ShowMoreButton({
  visible = true,
  expanded = false,
  onPress,
  label,
  moreLabel = "Xem thêm",
  lessLabel = "Thu gọn",
  style,
  textStyle
}) {
  const colors = useAppColors();

  if (!visible) return null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, style]}
      accessibilityRole="button"
    >
      <Text style={[styles.text, { color: colors.PRIMARY }, textStyle]}>{label || (expanded ? lessLabel : moreLabel)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  buttonPressed: {
    opacity: 0.7
  },
  text: {
    color: COLORS.PRIMARY,
    fontSize: 12,
    fontWeight: "700"
  }
});

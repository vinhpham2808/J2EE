import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../constants/colors";

export function FloatingTabButton({ onPress }) {
  return (
    <Pressable style={styles.floatingButton} onPress={onPress}>
      <Text style={styles.floatingButtonIcon}>＋</Text>
    </Pressable>
  );
}

export default function FloatingQuickMenu({ visible, onClose, onSelectRoute }) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(24)).current;
  const cardScale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.spring(cardTranslateY, {
          toValue: 0,
          damping: 14,
          stiffness: 170,
          mass: 0.7,
          useNativeDriver: true
        }),
        Animated.timing(cardScale, {
          toValue: 1,
          duration: 190,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        })
      ]).start();
    } else {
      overlayOpacity.setValue(0);
      cardTranslateY.setValue(24);
      cardScale.setValue(0.96);
    }
  }, [visible, overlayOpacity, cardTranslateY, cardScale]);

  const cardTransform = useMemo(
    () => [{ translateY: cardTranslateY }, { scale: cardScale }],
    [cardTranslateY, cardScale]
  );

  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <Animated.View style={[styles.menuOverlay, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View style={[styles.quickMenuCard, { transform: cardTransform }]}>
          <View style={styles.quickMenuGrid}>
            <Pressable style={styles.quickMenuItem} onPress={() => onSelectRoute("Income")}>
              <Text style={styles.quickMenuIcon}>💰</Text>
              <Text style={styles.quickMenuText}>Thu nhập</Text>
            </Pressable>

            <Pressable style={styles.quickMenuItem} onPress={() => onSelectRoute("Budget")}>
              <Text style={styles.quickMenuIcon}>🎯</Text>
              <Text style={styles.quickMenuText}>Ngân sách</Text>
            </Pressable>

            <Pressable style={styles.quickMenuItem} onPress={() => onSelectRoute("SavingGoal")}>
              <Text style={styles.quickMenuIcon}>🏦</Text>
              <Text style={styles.quickMenuText}>Mục tiêu</Text>
            </Pressable>

            <Pressable style={styles.quickMenuItem} onPress={() => onSelectRoute("Forecast")}>
              <Text style={styles.quickMenuIcon}>🔮</Text>
              <Text style={styles.quickMenuText}>Dự báo</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -24,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 9,
    alignSelf: "center"
  },
  floatingButtonIcon: {
    color: COLORS.DARK_TEXT,
    fontSize: 24,
    fontWeight: "800",
    marginTop: -2
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 86
  },
  quickMenuCard: {
    width: "80%",
    borderRadius: 16,
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 10
  },
  quickMenuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8
  },
  quickMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: COLORS.DARK_CARD_SOLID,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.DARK_BORDER,
    width: "48%",
    alignSelf: "flex-start"
  },
  quickMenuIcon: {
    fontSize: 18,
    marginRight: 10
  },
  quickMenuText: {
    color: COLORS.DARK_TEXT,
    fontSize: 14,
    fontWeight: "600"
  }
});
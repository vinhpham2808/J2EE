import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";

export default function AiInsightStateBlock({ error, loading, onRetry }) {
  if (loading) {
    return (
      <View style={styles.stateBox}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.stateText}>Đang phân tích...</Text>
      </View>
    );
  }

  if (!error) {
    return null;
  }

  return (
    <View style={styles.stateBox}>
      <Text style={styles.stateIcon}>⚠</Text>
      <Text style={styles.stateText}>{error}</Text>
      <Pressable style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>Thử lại</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stateBox: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    gap: 8
  },
  stateIcon: {
    fontSize: 26
  },
  stateText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 12
  },
  retryBtn: {
    marginTop: 4,
    backgroundColor: COLORS.ROSE_MIST,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER
  },
  retryBtnText: {
    color: COLORS.PRIMARY,
    fontSize: 13,
    fontWeight: "700"
  }
});

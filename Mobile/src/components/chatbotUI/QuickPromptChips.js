import React from "react";
import { StyleSheet, Text, View, Pressable, FlatList } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";

const QUICK_ACTIONS = [
  {
    label: "💰 Gợi ý tiết kiệm",
    text: "Gợi ý cách tiết kiệm dựa trên thói quen chi tiêu của tôi",
  },
  {
    label: "🧠 Tâm lý chi tiêu",
    text: "Tại sao tôi hay mua sắm bốc đồng và làm sao để kiểm soát?",
  },
  {
    label: "💬 Đang lo về tiền",
    text: "Tôi đang stress và lo lắng về tài chính, bạn có thể lắng nghe không?",
  },
  {
    label: "🎯 Lên kế hoạch",
    text: "Giúp tôi lên kế hoạch tiết kiệm cho một mục tiêu lớn",
  },
];

export default function QuickPromptChips({ onSelect }) {
  const colors = useAppColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.TEXT_MUTED }]}>Thử gõ nhanh các gợi ý sau:</Text>
      <FlatList
        data={QUICK_ACTIONS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.label}
        contentContainerStyle={styles.chipsScroll}
        renderItem={({ item }) => (
          <Pressable 
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: colors.CARD,
                borderColor: colors.CHAT_BORDER,
                shadowColor: colors.PRIMARY,
              },
              pressed && styles.chipPressed
            ]} 
            onPress={() => onSelect(item)}
          >
            <Text style={[styles.chipText, { color: colors.PRIMARY }]}>{item.label}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 12
  },
  title: {
    fontSize: 11,
    fontWeight: "750",
    color: COLORS.TEXT_SECONDARY,
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1.1
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 8
  },
  chip: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.CARD,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 1
  },
  chipPressed: {
    opacity: 0.85,
    backgroundColor: COLORS.ROSE_MIST,
    borderColor: "rgba(232, 89, 126, 0.35)"
  },
  chipText: {
    color: COLORS.PRIMARY,
    fontSize: 13,
    fontWeight: "600"
  }
});

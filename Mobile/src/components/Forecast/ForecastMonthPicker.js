import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";

export default function ForecastMonthPicker({
  label,
  hint,
  visible,
  options,
  selectedMonth,
  selectedYear,
  onOpen,
  onSelect,
  onClose,
}) {
  const colors = useAppColors();

  return (
    <>
      <View style={styles.monthPickerRow}>
        <Pressable
          style={({ pressed }) => [styles.monthPicker, { backgroundColor: colors.CARD, borderColor: colors.PRIMARY_LIGHT }, pressed && styles.monthPickerPressed]}
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel="Chọn tháng dự báo"
        >
          <Text style={styles.monthPickerIcon}>{"\uD83D\uDCC5"}</Text>
          <Text style={[styles.monthLabel, { color: colors.TEXT }]}>{label}</Text>
        </Pressable>
        <Text style={[styles.monthHint, { color: colors.TEXT_SECONDARY }]}>{hint}</Text>
      </View>

      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.monthModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <View style={[styles.monthModalCard, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}> 
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((option) => {
                const active = option.month === selectedMonth && option.year === selectedYear;
                return (
                  <Pressable
                    key={`${option.year}-${option.month}`}
                    style={[styles.monthOption, { borderBottomColor: colors.CARD_BORDER }, active && { backgroundColor: colors.ROSE_MIST }]}
                    onPress={() => onSelect(option.month, option.year)}
                  >
                    <Text style={[styles.monthOptionText, { color: active ? colors.PRIMARY : colors.TEXT }, active && styles.monthOptionTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  monthPickerRow: {
    alignItems: "center",
    marginBottom: 16,
  },
  monthPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.CARD,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY_LIGHT,
    width: "62%",
    minWidth: 150,
    maxWidth: 180,
    height: 40,
    paddingHorizontal: 16,
  },
  monthPickerPressed: {
    opacity: 0.78,
  },
  monthPickerIcon: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    marginRight: 8,
    textAlign: "center",
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT,
    textAlign: "center",
  },
  monthHint: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 15,
    marginTop: 10,
    textAlign: "center",
  },
  monthModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.OVERLAY,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  monthModalCard: {
    width: "100%",
    maxWidth: 340,
    maxHeight: "72%",
    backgroundColor: COLORS.CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingVertical: 8,
  },
  monthOption: {
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.CARD_BORDER,
  },
  monthOptionActive: {
    backgroundColor: COLORS.ROSE_MIST,
  },
  monthOptionText: {
    color: COLORS.TEXT,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  monthOptionTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: "900",
  },
});

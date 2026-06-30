import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../constants/colors";
import AppIcon from "../ui/AppIcon";
import { clampScale, scale } from "../../utils/layoutScale";
import {
  NOTIFICATION_CATEGORY_FILTERS,
  NOTIFICATION_READ_FILTERS
} from "../../utils/notificationFilters";

export function NotificationFilters({ categoryFilter, colors, readFilter, setCategoryFilter, setReadFilter }) {
  const { t } = useTranslation();
  const READ_FILTER_OPTIONS = [
    { id: NOTIFICATION_READ_FILTERS.ALL, label: t("notificationControls.all") },
    { id: NOTIFICATION_READ_FILTERS.UNREAD, label: t("notificationControls.unread") }
  ];
  const CATEGORY_FILTER_OPTIONS = [
    { id: NOTIFICATION_CATEGORY_FILTERS.ALL, label: t("notificationControls.all"), compactLabel: t("notificationControls.all"), icon: "notifications-outline" },
    { id: NOTIFICATION_CATEGORY_FILTERS.FINANCIAL, label: t("notificationControls.balanceChanges"), compactLabel: t("notificationControls.balance"), icon: "trending-up-outline" },
    { id: NOTIFICATION_CATEGORY_FILTERS.BUDGET, label: t("notificationControls.budget"), compactLabel: t("notificationControls.budget"), icon: "shield-checkmark-outline" },
    { id: NOTIFICATION_CATEGORY_FILTERS.SYSTEM, label: t("notificationControls.system"), compactLabel: t("notificationControls.system"), icon: "sparkles-outline" }
  ];
  return (
    <View style={[styles.filterPanel, { borderBottomColor: colors.CARD_BORDER }]}>
      <View style={[styles.readFilterGroup, { backgroundColor: colors.BG, borderColor: colors.CARD_BORDER }]}>
        {READ_FILTER_OPTIONS.map((option) => {
          const active = readFilter === option.id;
          return (
            <Pressable
              key={option.id}
              style={[
                styles.readFilterButton,
                active && {
                  backgroundColor: colors.CARD
                }
              ]}
              onPress={() => setReadFilter(option.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.readFilterText, { color: active ? colors.TEXT : colors.TEXT_SECONDARY }]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.categoryFilters}>
        {CATEGORY_FILTER_OPTIONS.map((option) => {
          const active = categoryFilter === option.id;
          return (
            <Pressable
              key={option.id}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: active ? colors.PRIMARY : colors.CARD,
                  borderColor: active ? colors.PRIMARY : colors.CARD_BORDER
                }
              ]}
              onPress={() => setCategoryFilter(option.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={option.label}
            >
              <AppIcon name={option.icon} size={14} color={active ? COLORS.WHITE : colors.TEXT_SECONDARY} />
              <Text style={[styles.categoryChipText, { color: active ? COLORS.WHITE : colors.TEXT_SECONDARY }]} numberOfLines={1}>
                {option.compactLabel || option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function SelectionBar({ allVisibleSelected, colors, onDeleteSelected, onToggleAll, selectedCount }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.selectionBar, { backgroundColor: colors.BG, borderBottomColor: colors.CARD_BORDER }]}>
      <Pressable
        style={styles.selectAllRow}
        onPress={onToggleAll}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: allVisibleSelected }}
      >
        <View style={[
          styles.selectButton,
          {
            borderColor: allVisibleSelected ? colors.PRIMARY : colors.CARD_BORDER,
            backgroundColor: allVisibleSelected ? colors.PRIMARY : colors.CARD
          }
        ]}>
          {allVisibleSelected ? <AppIcon name="checkmark" size={12} color={COLORS.WHITE} /> : null}
        </View>
        <Text style={[styles.selectAllText, { color: colors.TEXT_SECONDARY }]}>
          {selectedCount > 0 ? t("notificationControls.selectedCount", { count: selectedCount }) : t("notificationControls.selectAll")}
        </Text>
      </Pressable>
      {selectedCount > 0 ? (
        <Pressable
          style={[styles.deleteSelectedButton, { backgroundColor: colors.EXPENSE_LIGHT }]}
          onPress={onDeleteSelected}
          accessibilityRole="button"
          accessibilityLabel={t("notificationControls.deleteSelectedAccessibility")}
        >
          <AppIcon name="trash-outline" size={14} color={colors.EXPENSE} />
          <Text style={[styles.deleteSelectedText, { color: colors.EXPENSE }]}>{t("notificationControls.deleteSelected")}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  filterPanel: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(10),
    borderBottomWidth: 1,
    gap: scale(9)
  },
  readFilterGroup: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: scale(12),
    padding: scale(3),
    gap: scale(3)
  },
  readFilterButton: {
    flex: 1,
    minHeight: scale(32),
    borderRadius: scale(9),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(10)
  },
  readFilterText: {
    fontSize: clampScale(12, 10, 14),
    fontWeight: "800"
  },
  categoryFilters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8)
  },
  categoryChip: {
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: scale(36),
    borderRadius: scale(12),
    borderWidth: 1,
    paddingHorizontal: scale(10),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6)
  },
  categoryChipText: {
    fontSize: clampScale(12, 10, 14),
    fontWeight: "800"
  },
  selectionBar: {
    minHeight: scale(44),
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: scale(12)
  },
  selectAllRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  selectAllText: {
    fontSize: clampScale(12, 10, 14),
    fontWeight: "800"
  },
  selectButton: {
    width: scale(22),
    aspectRatio: 1,
    borderRadius: scale(7),
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(10)
  },
  deleteSelectedButton: {
    borderRadius: scale(12),
    paddingHorizontal: scale(10),
    paddingVertical: scale(8),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5)
  },
  deleteSelectedText: {
    fontSize: clampScale(12, 10, 14),
    fontWeight: "900"
  }
});

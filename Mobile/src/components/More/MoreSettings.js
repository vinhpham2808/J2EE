import React from "react";
import { Image, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, useAppColors } from "../../constants/colors";
import { MORE_MENU_GROUPS } from "./MoreMenuGroup";

function SettingGroup({ colors, title, children }) {
  return (
    <View style={[styles.groupCard, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}>
      {title ? (
        <View style={[styles.groupHeader, { borderBottomColor: colors.CARD_BORDER }]}>
          <Text style={[styles.groupHeaderText, { color: colors.ACTION_VOICE || '#A855F7' }]}>{title}</Text>
        </View>
      ) : null}
      <View style={styles.groupContent}>{children}</View>
    </View>
  );
}

function SettingItem({ colors, icon, image, title, subtitle, value, valueStyle, actionLabel, variant, rowDisabled = false, onPress, hasChevron = true, isSwitch = false, switchValue, onSwitchChange, disabled = false }) {
  const isUpgrade = variant === "upgrade";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.itemRow,
        { borderBottomColor: colors.BG },
        isUpgrade && styles.upgradeRow,
        pressed && !isSwitch && !rowDisabled && styles.itemRowPressed,
        disabled && styles.itemRowDisabled
      ]}
      onPress={rowDisabled ? undefined : onPress}
      disabled={isSwitch || disabled}
    >
      <View style={styles.itemLeft}>
        <View style={styles.itemIconWrap}>
          {image ? (
            <Image source={image} style={styles.itemIconImage} resizeMode="contain" />
          ) : (
            <Ionicons name={icon} size={16} color={colors.ACTION_VOICE || '#A855F7'} />
          )}
        </View>
        <View style={styles.itemTextWrap}>
          <Text style={[styles.itemTitle, { color: colors.TEXT }]}>{title}</Text>
          {subtitle ? <Text style={[styles.itemSubtitle, { color: colors.TEXT_SECONDARY }]}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.itemRight}>
        {value ? <Text style={[styles.itemValueText, { color: colors.TEXT_SECONDARY }, valueStyle]}>{value}</Text> : null}
        {actionLabel ? (
          <Pressable style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]} onPress={onPress}>
            <Text style={styles.actionButtonText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
        {isSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            disabled={disabled}
            trackColor={{ false: colors.TEXT_MUTED, true: colors.ACTION_VOICE || '#A855F7' }}
            ios_backgroundColor={colors.TEXT_MUTED}
            thumbColor={colors.WHITE}
          />
        ) : hasChevron ? (
          <Ionicons name="chevron-forward" size={18} color={colors.TEXT_MUTED} />
        ) : null}
      </View>
    </Pressable>
  );
}

export function LogoutButton({ onPress }) {
  const colors = useAppColors();

  return (
    <Pressable
      style={[styles.logoutButton, { backgroundColor: colors.CARD }]}
      android_ripple={{ color: "transparent" }}
      onPress={onPress}
    >
      <Text style={[styles.logoutText, { color: colors.EXPENSE }]}>Đăng xuất</Text>
    </Pressable>
  );
}

export default function MoreSettings({ appNotifications, emailPreferences, isDark, languageLabel, onAppNotificationsChange, onThemeChange, onItemPress }) {
  const colors = useAppColors();

  const getDynamicProps = (key) => {
    switch (key) {
      case "language":
        return { value: languageLabel, valueStyle: styles.languageValueText, hasChevron: true };
      case "app-notifications":
        return { switchValue: appNotifications, onSwitchChange: onAppNotificationsChange };
      case "email-reminder":
        return {
          switchValue: emailPreferences.isDailyEnabled,
          onSwitchChange: emailPreferences.toggleDailyEmail,
          disabled: emailPreferences.isUpdating || !emailPreferences.dailyReportPref
        };
      case "dark-mode":
        return {
          subtitle: isDark ? "Đang bật chế độ tối" : "Đang bật chế độ sáng",
          switchValue: isDark,
          onSwitchChange: onThemeChange
        };
      default:
        return {};
    }
  };

  return (
    <>
      {MORE_MENU_GROUPS.map((group) => (
        <SettingGroup key={group.key} colors={colors} title={group.title}>
          {group.items.map((item) => {
            const { key, ...settingItemProps } = item;
            const dynamicProps = getDynamicProps(key);

            return <SettingItem key={key} colors={colors} {...settingItemProps} {...dynamicProps} onPress={() => onItemPress(item)} />;
          })}
        </SettingGroup>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  groupCard: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },
  groupHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    borderBottomWidth: 2,
  },
  groupHeaderText: {
    fontSize: 11,
    fontWeight: "850",
    letterSpacing: 1.2,
  },
  groupContent: {
    flexDirection: "column",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1.5,
  },
  upgradeRow: {
    backgroundColor: "#EEF9FF",
    borderBottomWidth: 0,
    marginHorizontal: 8,
    marginVertical: 8,
    borderRadius: 8,
  },
  itemRowPressed: {
    backgroundColor: "rgba(232, 89, 126, 0.05)",
  },
  itemRowDisabled: {
    opacity: 0.6,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  itemIconWrap: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  itemIconImage: {
    width: 26,
    height: 26,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  itemTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  itemSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  itemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    backgroundColor: COLORS.ACTION_EXPENSE,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonPressed: {
    opacity: 0.82,
  },
  actionButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: "700",
  },
  itemValueText: {
    fontSize: 13,
    fontWeight: "600",
    marginRight: 6,
  },
  languageValueText: {
    color: "#EF4444",
    fontWeight: "900",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(231, 111, 81, 0.3)",
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "800",
  }
});

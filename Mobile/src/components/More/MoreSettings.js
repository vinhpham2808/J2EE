import React from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { MORE_MENU_GROUPS } from "../../constants/moreMenuConfig";

function SettingGroup({ title, children }) {
  return (
    <View style={styles.groupCard}>
      {title ? (
        <View style={styles.groupHeader}>
          <Text style={styles.groupHeaderText}>{title}</Text>
        </View>
      ) : null}
      <View style={styles.groupContent}>{children}</View>
    </View>
  );
}

function SettingItem({ icon, title, value, onPress, hasChevron = true, isSwitch = false, switchValue, onSwitchChange, disabled = false }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.itemRow, pressed && !isSwitch && styles.itemRowPressed, disabled && styles.itemRowDisabled]}
      onPress={onPress}
      disabled={isSwitch || disabled}
    >
      <View style={styles.itemLeft}>
        <View style={styles.itemIconWrap}>
          <Text style={styles.itemIconText}>{icon}</Text>
        </View>
        <Text style={styles.itemTitle}>{title}</Text>
      </View>
      <View style={styles.itemRight}>
        {value ? <Text style={styles.itemValueText}>{value}</Text> : null}
        {isSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            disabled={disabled}
            trackColor={{ false: COLORS.CARD_BORDER, true: COLORS.PRIMARY }}
            thumbColor={COLORS.WHITE}
          />
        ) : hasChevron ? (
          <Text style={styles.itemChevron}>›</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function LogoutButton({ onPress }) {
  return (
    <Pressable style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]} onPress={onPress}>
      <Text style={styles.logoutIcon}>🚪</Text>
      <Text style={styles.logoutText}>Đăng xuất</Text>
    </Pressable>
  );
}

export default function MoreSettings({ appNotifications, emailPreferences, onAppNotificationsChange, onItemPress }) {
  return (
    <>
      {MORE_MENU_GROUPS.map((group) => (
        <SettingGroup key={group.title} title={group.title}>
          {group.items.map((item) => (
            <SettingItem key={item.key} {...item} onPress={() => onItemPress(item)} />
          ))}
        </SettingGroup>
      ))}

      <SettingGroup title="THÔNG BÁO">
        <SettingItem
          icon="🔔"
          title="Thông báo ứng dụng"
          isSwitch
          switchValue={appNotifications}
          onSwitchChange={onAppNotificationsChange}
        />
        <SettingItem
          icon="✉️"
          title="Nhắc nhở qua Email"
          isSwitch
          switchValue={emailPreferences.isDailyEnabled}
          onSwitchChange={emailPreferences.toggleDailyEmail}
          disabled={emailPreferences.isUpdating || !emailPreferences.dailyReportPref}
        />
      </SettingGroup>
    </>
  );
}

const styles = StyleSheet.create({
  groupCard: { backgroundColor: COLORS.CARD, borderRadius: 18, borderWidth: 1, borderColor: COLORS.CARD_BORDER, marginBottom: 16, overflow: "hidden" },
  groupHeader: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: COLORS.CARD_BORDER },
  groupHeaderText: { color: COLORS.PRIMARY, fontSize: 11, fontWeight: "850", letterSpacing: 1.2 },
  groupContent: { flexDirection: "column" },
  itemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.BG },
  itemRowPressed: { backgroundColor: "rgba(232, 89, 126, 0.05)" },
  itemRowDisabled: { opacity: 0.6 },
  itemLeft: { flexDirection: "row", alignItems: "center" },
  itemIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.BG, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.CARD_BORDER },
  itemIconText: { fontSize: 15 },
  itemTitle: { color: COLORS.TEXT, fontSize: 15, fontWeight: "600", marginLeft: 12 },
  itemRight: { flexDirection: "row", alignItems: "center" },
  itemValueText: { color: COLORS.TEXT_SECONDARY, fontSize: 13, fontWeight: "600", marginRight: 6 },
  itemChevron: { color: COLORS.TEXT_SECONDARY, fontSize: 22, fontWeight: "700" },
  logoutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.CARD, borderWidth: 1, borderColor: "rgba(231, 111, 81, 0.3)", borderRadius: 16, paddingVertical: 15, marginTop: 12, marginBottom: 20 },
  logoutButtonPressed: { backgroundColor: "rgba(231, 111, 81, 0.04)", transform: [{ scale: 0.99 }] },
  logoutIcon: { fontSize: 16, marginRight: 6 },
  logoutText: { color: COLORS.EXPENSE, fontSize: 16, fontWeight: "800" }
});

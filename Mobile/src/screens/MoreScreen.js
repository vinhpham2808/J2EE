import React, { useCallback, useContext, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View, Image } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../components/AuthContext";
import { COLORS } from "../constants/colors";
import { API_ENDPOINTS } from "../constants/api";
import http from "../services/http";
import { getApiErrorMessage } from "../utils/format";
import { getSafeAreaContentStyle } from "../utils/safeAreaSpacing";

// ─── Modular Helper Components ───────────────────────────────

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
      style={({ pressed }) => [
        styles.itemRow,
        pressed && !isSwitch && styles.itemRowPressed,
        disabled && styles.itemRowDisabled
      ]}
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

// ─── Main More/Settings Screen ────────────────────────────────

export default function MoreScreen() {
  const navigation = useNavigation();
  const { user, signOut } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [preferences, setPreferences] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [appNotifications, setAppNotifications] = useState(true);

  const fetchPreferences = useCallback(async () => {
    try {
      const response = await http.get(API_ENDPOINTS.GET_EMAIL_PREFERENCES);
      setPreferences(response.data || []);
    } catch (error) {
      console.error("Lỗi lấy cài đặt email:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPreferences();
    }, [fetchPreferences])
  );

  const dailyReportPref = preferences.find(p => p.type === "DAILY_EXPENSE_REPORT");
  const isDailyEnabled = dailyReportPref?.isEnabled ?? false;

  const handleToggleDailyEmail = async (newValue) => {
    if (!dailyReportPref) return;
    setIsUpdating(true);
    try {
      const updatedPreferences = preferences.map(p =>
        p.type === "DAILY_EXPENSE_REPORT" ? { ...p, isEnabled: newValue } : p
      );

      setPreferences(updatedPreferences);
      await http.put(API_ENDPOINTS.UPDATE_EMAIL_PREFERENCES, updatedPreferences);
    } catch (error) {
      setPreferences(preferences); // Revert on error
      Alert.alert("Lỗi", getApiErrorMessage(error, "Không thể cập nhật cài đặt email."));
    } finally {
      setIsUpdating(false);
    }
  };

  const fullName = user?.fullName || "Người dùng";
  const email = user?.email || "Chưa có email";
  const profileImageUrl = user?.profileImageUrl || "";
  const initial = fullName.slice(0, 1).toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, getSafeAreaContentStyle(insets)]} showsVerticalScrollIndicator={false}>
      {/* Profile Overview Banner Section */}
      <Pressable 
        style={({ pressed }) => [styles.profileHeroCard, pressed && styles.profileHeroCardPressed]}
        onPress={() => navigation.navigate("Profile")}
      >
        {profileImageUrl ? (
          <Image source={{ uri: profileImageUrl }} style={styles.heroAvatar} />
        ) : (
          <View style={styles.heroAvatarPlaceholder}>
            <Text style={styles.heroAvatarText}>{initial}</Text>
          </View>
        )}
        <View style={styles.heroTextWrap}>
          <Text style={styles.heroName}>{fullName}</Text>
          <Text style={styles.heroEmail}>{email}</Text>
        </View>
        <Text style={styles.heroChevron}>›</Text>
      </Pressable>

      {/* Account Settings Group */}
      <SettingGroup title="TÀI KHOẢN">
        <SettingItem
          icon="👤"
          title="Thông tin cá nhân"
          onPress={() => navigation.navigate("Profile")}
        />
        <SettingItem
          icon="🔒"
          title="Đổi mật khẩu"
          onPress={() => navigation.navigate("EditProfile")}
        />
        <SettingItem
          icon="💳"
          title="Thanh toán & Nâng cấp"
          onPress={() => navigation.navigate("Payment")}
        />
      </SettingGroup>

      {/* Customization Settings Group */}
      <SettingGroup title="TÙY CHỈNH">
        <SettingItem
          icon="💵"
          title="Đơn vị tiền tệ"
          value="VND"
          hasChevron={false}
        />
        <SettingItem
          icon="🌐"
          title="Ngôn ngữ"
          value="Vietnamese"
          hasChevron={false}
        />
        <SettingItem
          icon="🌙"
          title="Giao diện"
          value="Chế độ tối"
          hasChevron={false}
        />
      </SettingGroup>

      {/* Financial Management Group */}
      <SettingGroup title="QUẢN LÝ TÀI CHÍNH">
        <SettingItem
          icon="📦"
          title="Hũ chi tiêu phụ"
          onPress={() => navigation.navigate("Jars")}
        />
        <SettingItem
          icon="📊"
          title="Báo cáo thu chi tháng"
          onPress={() => navigation.navigate("Reports")}
        />
      </SettingGroup>

      {/* AI Assistance Group */}
      <SettingGroup title="TRỢ LÝ AI">
        <SettingItem
          icon="✨"
          title="Trò chuyện Gemini AI"
          onPress={() => navigation.navigate("Chat")}
        />
      </SettingGroup>

      {/* Notification Preferences Group */}
      <SettingGroup title="THÔNG BÁO">
        <SettingItem
          icon="🔔"
          title="Thông báo ứng dụng"
          isSwitch={true}
          switchValue={appNotifications}
          onSwitchChange={setAppNotifications}
        />
        <SettingItem
          icon="✉️"
          title="Nhắc nhở qua Email"
          isSwitch={true}
          switchValue={isDailyEnabled}
          onSwitchChange={handleToggleDailyEmail}
          disabled={isUpdating || !dailyReportPref}
        />
      </SettingGroup>

      {/* App Info Group */}
      <SettingGroup title="THÔNG TIN ỨNG DỤNG">
        <SettingItem
          icon="❓"
          title="Trợ giúp & Hỗ trợ"
          hasChevron={true}
        />
        <SettingItem
          icon="🛡️"
          title="Chính sách bảo mật"
          hasChevron={true}
        />
        <SettingItem
          icon="ℹ️"
          title="Phiên bản"
          value="1.0.0 (Build 42)"
          hasChevron={false}
        />
      </SettingGroup>

      {/* Wide Outline Red Log Out Button */}
      <Pressable 
        style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]} 
        onPress={signOut}
      >
        <Text style={styles.logoutIcon}>🚪</Text>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </Pressable>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 90
  },
  profileHeroCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 16,
    marginBottom: 20,
    shadowColor: COLORS.BLACK,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  profileHeroCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }]
  },
  heroAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY_GLOW
  },
  heroAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.PRIMARY,
    alignItems: "center",
    justifyContent: "center"
  },
  heroAvatarText: {
    color: COLORS.WHITE,
    fontWeight: "800",
    fontSize: 22
  },
  heroTextWrap: {
    marginLeft: 14,
    flex: 1
  },
  heroName: {
    color: COLORS.TEXT,
    fontSize: 18,
    fontWeight: "800"
  },
  heroEmail: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    marginTop: 2
  },
  heroChevron: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 24,
    fontWeight: "700"
  },
  groupCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    marginBottom: 16,
    overflow: "hidden"
  },
  groupHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.CARD_BORDER
  },
  groupHeaderText: {
    color: COLORS.PRIMARY,
    fontSize: 11,
    fontWeight: "850",
    letterSpacing: 1.2
  },
  groupContent: {
    flexDirection: "column"
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BG
  },
  itemRowPressed: {
    backgroundColor: 'rgba(232, 89, 126, 0.05)'
  },
  itemRowDisabled: {
    opacity: 0.6
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  itemIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.BG,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER
  },
  itemIconText: {
    fontSize: 15
  },
  itemTitle: {
    color: COLORS.TEXT,
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 12
  },
  itemRight: {
    flexDirection: "row",
    alignItems: "center"
  },
  itemValueText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    fontWeight: "600",
    marginRight: 6
  },
  itemChevron: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 22,
    fontWeight: "700"
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.CARD,
    borderWidth: 1,
    borderColor: 'rgba(231, 111, 81, 0.3)',
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 12,
    marginBottom: 20
  },
  logoutButtonPressed: {
    backgroundColor: 'rgba(231, 111, 81, 0.04)',
    transform: [{ scale: 0.99 }]
  },
  logoutIcon: {
    fontSize: 16,
    marginRight: 6
  },
  logoutText: {
    color: COLORS.EXPENSE,
    fontSize: 16,
    fontWeight: "800"
  }
});

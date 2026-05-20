import React, { useCallback, useContext, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { AuthContext } from "../components/AuthContext";
import { COLORS } from "../constants/colors";
import { API_ENDPOINTS } from "../constants/api";
import http from "../services/http";
import { getApiErrorMessage } from "../utils/format";

function UserAvatar({ fullName }) {
  const initial = (fullName || "U").slice(0, 1).toUpperCase();

  return (
    <View style={styles.avatarWrap}>
      <Text style={styles.avatarText}>{initial}</Text>
    </View>
  );
}

function MenuCard({ title, description, onPress }) {
  return (
    <Pressable style={styles.menuCard} onPress={onPress}>

      <View style={styles.menuBody}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuDescription}>{description}</Text>
      </View>
    </Pressable>
  );
}

function MenuToggleCard({ title, description, value, onValueChange, disabled }) {
  return (
    <View style={styles.menuCard}>
      <View style={styles.menuBody}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: COLORS.CARD_BORDER, true: COLORS.PRIMARY }}
        thumbColor={COLORS.WHITE}
      />
    </View>
  );
}

export default function MoreScreen() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  const [preferences, setPreferences] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Quản lý tài khoản</Text>
      </View>

      <MenuCard
        title="Hồ sơ cá nhân"
        description="Xem chi tiết thông tin tài khoản của bạn"
        onPress={() => navigation.navigate("Profile")}
      />

      <MenuCard
        title="Thanh toán"
        description="Nâng cấp gói và kiểm tra trạng thái giao dịch"
        onPress={() => navigation.navigate("Payment")}
      />

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>AI & Phân tích chuyên sâu</Text>
      </View>

      <MenuCard
        title="Trò chuyện AI"
        description="Hỏi Gemini AI về quản lý chi tiêu và tiết kiệm"
        onPress={() => navigation.navigate("Chat")}
      />

      <MenuCard
        title="Báo cáo tài chính tháng"
        description="Xem điểm đánh giá tài chính và cơ cấu thu chi chi tiết"
        onPress={() => navigation.navigate("Reports")}
      />

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Thông báo</Text>
      </View>

      <MenuToggleCard
        title="Nhắc nhở hằng ngày"
        description="Nhận email nhắc nhở cập nhật thu chi vào lúc 22:00 mỗi ngày"
        value={isDailyEnabled}
        onValueChange={handleToggleDailyEmail}
        disabled={isUpdating || !dailyReportPref}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
    paddingTop: 50
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24
  },
  heroCard: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.PRIMARY_DARK,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.PRIMARY_LIGHT
  },
  avatarText: {
    color: COLORS.WHITE,
    fontWeight: "800",
    fontSize: 20
  },
  heroTextWrap: {
    marginLeft: 12,
    flex: 1
  },
  heroTitle: {
    color: COLORS.DARK_TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: "600"
  },
  heroName: {
    color: COLORS.WHITE,
    fontSize: 19,
    fontWeight: "800",
    marginTop: 2
  },
  heroEmail: {
    color: COLORS.PEACH,
    marginTop: 12,
    fontSize: 14
  },
  sectionHeaderRow: {
    marginBottom: 8,
    marginTop: 2
  },
  sectionTitle: {
    color: COLORS.TEXT,
    fontSize: 16,
    fontWeight: "800"
  },
  menuCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center"
  },
  menuBody: {
    flex: 1,
    paddingHorizontal: 12
  },
  menuTitle: {
    color: COLORS.TEXT,
    fontSize: 16,
    fontWeight: "700"
  },
  menuDescription: {
    color: COLORS.TEXT_SECONDARY,
    marginTop: 3,
    lineHeight: 18
  },
  menuArrow: {
    color: COLORS.TEXT_MUTED,
    fontSize: 24,
    fontWeight: "700"
  },
  noteCard: {
    marginTop: 4,
    backgroundColor: COLORS.ROSE_MIST,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 12
  },
  noteTitle: {
    color: COLORS.PRIMARY,
    fontWeight: "800",
    marginBottom: 4
  },
  noteText: {
    color: COLORS.PRIMARY_DARK,
    lineHeight: 18
  }
});
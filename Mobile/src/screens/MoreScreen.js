import React, { useContext } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../components/AuthContext";
import { COLORS } from "../constants/colors";

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

export default function MoreScreen() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

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
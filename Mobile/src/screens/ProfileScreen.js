import React, { useContext } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../components/AuthContext";
import { COLORS } from "../constants/colors";
import { getSafeAreaBottom, getSafeAreaTop } from "../utils/safeAreaSpacing";

function InfoRow({ label, value, showChevron = false, isLast = false }) {
  return (
    <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValueWrap}>
        <Text style={[styles.infoValue, label === "Số điện thoại" && styles.infoValueUnset]}>{value || "-"}</Text>
        {showChevron && <Text style={styles.infoChevron}>›</Text>}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const fullName = user?.fullName || "Người dùng";
  const email = user?.email || "Chưa có email";
  const initial = fullName.slice(0, 1).toUpperCase();
  const profileImageUrl = user?.profileImageUrl || "";
  const subscriptionPlan = String(user?.subscriptionPlan || "FREE").toUpperCase();

  return (
    <View style={[styles.safeArea, { paddingTop: getSafeAreaTop(insets, 0) }]}>
      
      {/* Top Application Bar matching mockup */}
      <View style={styles.topAppBar}>
        <Text style={styles.appBarTitle}>Hồ sơ</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: getSafeAreaBottom(insets) }]} showsVerticalScrollIndicator={false}>
        
        {/* User Profile Header Card */}
        <View style={styles.heroCard}>
          {profileImageUrl ? (
            <Image source={{ uri: profileImageUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}

          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{fullName}</Text>
            <Text style={styles.heroEmail}>{email}</Text>
            <View style={styles.planChip}>
              <Text style={styles.planChipText}>{subscriptionPlan}</Text>
            </View>
          </View>
        </View>

        {/* Personal Information Group Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
        </View>
        <View style={styles.sectionCard}>
          <InfoRow label="Họ và tên" value={fullName} />
          <InfoRow label="Email" value={email} />
          <InfoRow label="Số điện thoại" value="Chưa cập nhật" showChevron={true} isLast={true} />
        </View>

        {/* Service Plan Group Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Gói dịch vụ</Text>
        </View>
        <View style={styles.sectionCard}>
          <View style={styles.planRow}>
            <Text style={styles.planLabel}>Gói hiện tại</Text>
            <Text style={styles.planValue}>{subscriptionPlan}</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  topAppBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: COLORS.BG,
  },
  appBarTitle: {
    color: COLORS.TEXT,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 20,
    marginBottom: 24,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.BG,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
  },
  avatarText: {
    color: COLORS.WHITE,
    fontSize: 24,
    fontWeight: "bold",
  },
  heroInfo: {
    marginLeft: 16,
    flex: 1,
  },
  heroName: {
    color: COLORS.TEXT,
    fontSize: 18,
    fontWeight: "700",
  },
  heroEmail: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    marginTop: 2,
  },
  planChip: {
    alignSelf: "flex-start",
    marginTop: 8,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(239, 94, 131, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(239, 94, 131, 0.3)",
  },
  planChipText: {
    color: COLORS.PRIMARY,
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  sectionHeader: {
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionTitle: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    fontWeight: "600",
  },
  sectionCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    marginBottom: 24,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.CARD_BORDER,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: "500",
  },
  infoValueWrap: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "65%",
  },
  infoValue: {
    color: COLORS.TEXT,
    fontWeight: "600",
    fontSize: 14,
    textAlign: "right",
  },
  infoValueUnset: {
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "500",
  },
  infoChevron: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 6,
    marginTop: -2,
  },
  planRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  planLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: "500",
  },
  planValue: {
    color: COLORS.PRIMARY,
    fontWeight: "bold",
    fontSize: 14,
  },
});

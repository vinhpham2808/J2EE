import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, useAppColors } from "../../constants/colors";

export default function ProfileHero({ user, onPress }) {
  const colors = useAppColors();
  const fullName = user?.fullName || "Người dùng";
  const email = user?.email || "Chưa có email";
  const profileImageUrl = user?.profileImageUrl || "";
  const initial = fullName.slice(0, 1).toUpperCase();

  return (
    <Pressable style={({ pressed }) => [styles.profileHeroCard, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }, pressed && styles.profileHeroCardPressed]} onPress={onPress}>
      {profileImageUrl ? (
        <Image source={{ uri: profileImageUrl }} style={[styles.heroAvatar, { borderColor: colors.PRIMARY_GLOW }]} />
      ) : (
        <View style={[styles.heroAvatarPlaceholder, { backgroundColor: colors.PRIMARY }]}>
          <Text style={styles.heroAvatarText}>{initial}</Text>
        </View>
      )}
      <View style={styles.heroTextWrap}>
        <Text style={[styles.heroName, { color: colors.TEXT }]}>{fullName}</Text>
        <Text style={[styles.heroEmail, { color: colors.TEXT_SECONDARY }]}>{email}</Text>
      </View>
      <Text style={[styles.heroChevron, { color: colors.TEXT_SECONDARY }]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },
  profileHeroCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  heroAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY_GLOW,
  },
  heroAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  heroAvatarText: {
    color: COLORS.WHITE,
    fontWeight: "800",
    fontSize: 22,
  },
  heroTextWrap: {
    marginLeft: 14,
    flex: 1,
  },
  heroName: {
    color: COLORS.TEXT,
    fontSize: 18,
    fontWeight: "800",
  },
  heroEmail: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    marginTop: 2,
  },
  heroChevron: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 24,
    fontWeight: "700",
  }
});

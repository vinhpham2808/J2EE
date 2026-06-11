import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useAppColors } from "../../constants/colors";
import AppIcon from "../ui/AppIcon";
import WalletGradientCard from "../ui/WalletGradientCard";
import ChangeRateBadge from "../ui/ChangeRateBadge";
import AmountText from "../ui/AmountText";

export default function HomeBanner({ balanceData, isBalanceVisible = true, monthlySeries }) {
  const colors = useAppColors();
  const balance = balanceData?.totalBalance ?? 0;

  // Calculate change rate compared to the previous month
  let changeRate = 13.0; // fallback
  if (Array.isArray(monthlySeries) && monthlySeries.length >= 2) {
    const current = monthlySeries[monthlySeries.length - 1];
    const prev = monthlySeries[monthlySeries.length - 2];
    const currentNet = (current.income || 0) - (current.expense || 0);
    const prevNet = (prev.income || 0) - (prev.expense || 0);
    if (prevNet !== 0) {
      changeRate = ((currentNet - prevNet) / Math.abs(prevNet)) * 100;
    } else if (currentNet > 0) {
      changeRate = 100.0;
    } else if (currentNet < 0) {
      changeRate = -100.0;
    } else {
      changeRate = 0.0;
    }
  }

  return (
    <WalletGradientCard style={styles.card}>
      <Image source={require("../../assets/expense/wallet.png")} style={styles.walletImage} />

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AppIcon name="albums-outline" size={18} color="#FFFFFF" style={styles.walletIcon} />
          <Text style={styles.titleText}>Ví cá nhân</Text>
        </View>
      </View>

      <View style={styles.balanceContainer}>
        {isBalanceVisible ? (
          <AmountText value={balance} style={styles.balanceText} />
        ) : (
          <Text style={styles.balanceText}>••••••</Text>
        )}
      </View>

      <View style={styles.footer}>
        <ChangeRateBadge
          value={changeRate}
          label="so với tháng trước"
          labelColor="rgba(255, 255, 255, 0.8)"
          style={styles.badge}
        />
      </View>
    </WalletGradientCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 2,
    marginBottom: 8,
    overflow: "hidden",
  },
  walletImage: {
    position: "absolute",
    right: 16,
    bottom: 18,
    width: 96,
    height: 96,
    resizeMode: "contain",
    opacity: 0.95,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  walletIcon: {
    marginRight: 6,
  },
  titleText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  balanceContainer: {
    marginBottom: 16,
    paddingRight: 108,
  },
  balanceText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 108,
  },
  badge: {
    // Styling defined inside ChangeRateBadge
  },
});

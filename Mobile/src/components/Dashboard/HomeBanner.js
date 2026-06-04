import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { COLORS } from "../../constants/colors";
import bannerImage from "../../assets/moneymanagerbanner.avif";

export default function HomeBanner() {
  return (
    <View style={styles.wrapper}>
      <Image source={bannerImage} style={styles.banner} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    backgroundColor: COLORS.CARD
  },
  banner: {
    width: "100%",
    height: 122
  }
});

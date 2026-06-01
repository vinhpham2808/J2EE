import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { COLORS } from "../../constants/colors";
import appLogo from "../../assets/applogo.png";

export default function AssistantAvatar() {
  return (
    <View style={styles.assistantAvatar}>
      <Image source={appLogo} style={styles.assistantAvatarImage} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  assistantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: COLORS.ROSE_MIST,
    borderWidth: 1,
    borderColor: "rgba(239, 94, 131, 0.18)",
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: "hidden",
  },
  assistantAvatarImage: {
    width: 40,
    height: 40,
  },
});

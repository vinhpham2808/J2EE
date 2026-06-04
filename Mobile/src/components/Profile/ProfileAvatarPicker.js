import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";

export default function ProfileAvatarPicker({ fullName, onPickImage, onRemoveImage, previewUri }) {
  return (
    <View style={styles.avatarSection}>
      <View style={styles.avatarWrap}>
        <View style={styles.avatarFrame}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>{(fullName || "U").slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <Pressable style={styles.avatarEditButton} onPress={onPickImage}>
          <Text style={styles.avatarEditButtonText}>✎</Text>
        </Pressable>
      </View>

      {previewUri ? (
        <Pressable style={styles.removeAvatarButton} onPress={onRemoveImage}>
          <Text style={styles.removeAvatarButtonText}>Xóa ảnh hiện tại</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: "center",
    marginBottom: 12
  },
  avatarWrap: {
    position: "relative"
  },
  avatarFrame: {
    width: 108,
    height: 108,
    borderRadius: 54,
    padding: 6,
    backgroundColor: COLORS.BG,
    borderWidth: 2,
    borderColor: COLORS.CARD_BORDER
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY_GLOW,
    backgroundColor: COLORS.BG,
    overflow: "hidden"
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY_GLOW,
    backgroundColor: COLORS.BG,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  avatarPlaceholderText: {
    color: COLORS.TEXT,
    fontWeight: "800",
    fontSize: 32
  },
  avatarEditButton: {
    position: "absolute",
    right: -6,
    bottom: -2,
    minWidth: 34,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.CARD,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8
  },
  avatarEditButtonText: {
    color: COLORS.PRIMARY,
    fontWeight: "700",
    fontSize: 14
  },
  removeAvatarButton: {
    marginTop: 8
  },
  removeAvatarButtonText: {
    color: COLORS.EXPENSE,
    fontWeight: "600",
    fontSize: 13
  }
});

import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PasswordChangeFields from "../../components/Profile/PasswordChangeFields";
import ProfileAvatarPicker from "../../components/Profile/ProfileAvatarPicker";
import ProfileInfoFields from "../../components/Profile/ProfileInfoFields";
import { COLORS, useAppColors } from "../../constants/colors";
import useEditProfileForm from "../../hooks/useEditProfileForm";
import { getSafeAreaContentStyle } from "../../utils/safeArea";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const form = useEditProfileForm();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.BG }]} contentContainerStyle={[styles.content, getSafeAreaContentStyle(insets)]}>
      <View style={[styles.card, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}> 
        <Text style={[styles.title, { color: colors.TEXT }]}>Chỉnh sửa hồ sơ</Text>
        <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>Cập nhật thông tin cá nhân và mật khẩu theo nhu cầu của bạn.</Text>

        <ProfileAvatarPicker
          fullName={form.fullName}
          previewUri={form.previewUri}
          onPickImage={form.onPickImage}
          onRemoveImage={form.onRemoveImage}
        />

        <ProfileInfoFields
          email={form.email}
          fullName={form.fullName}
          setEmail={form.setEmail}
          setFullName={form.setFullName}
        />

        <PasswordChangeFields
          confirmPassword={form.confirmPassword}
          currentPassword={form.currentPassword}
          newPassword={form.newPassword}
          setConfirmPassword={form.setConfirmPassword}
          setCurrentPassword={form.setCurrentPassword}
          setNewPassword={form.setNewPassword}
          setShowPasswordFields={form.setShowPasswordFields}
          showPasswordFields={form.showPasswordFields}
        />

        <Pressable
          style={[styles.saveButton, form.saving && styles.saveButtonDisabled]}
          onPress={form.onSave}
          disabled={form.saving}
        >
          <Text style={styles.saveButtonText}>{form.saving ? "Đang lưu..." : "Lưu thay đổi"}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  content: {
    padding: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: COLORS.CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 16,
    shadowColor: COLORS.BLACK,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2
  },
  title: {
    color: COLORS.TEXT,
    fontWeight: "800",
    fontSize: 22,
    marginBottom: 4
  },
  subtitle: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 14,
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2
  },
  saveButtonDisabled: {
    opacity: 0.6
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontWeight: "800",
    fontSize: 16
  }
});

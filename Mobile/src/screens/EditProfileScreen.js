import React, { useCallback, useContext, useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../components/AuthContext";
import http from "../services/http";
import { API_ENDPOINTS } from "../constants/api";
import { SUCCESS_ALERT_MESSAGES, SUCCESS_ALERT_TITLE } from "../constants/alertMessages";
import { tokenStorage } from "../storage/tokenStorage";
import { getApiErrorMessage } from "../utils/format";
import uploadProfileImage from "../utils/uploadProfileImage";
import { COLORS } from "../constants/colors";
import { getSafeAreaContentStyle } from "../utils/safeAreaSpacing";

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export default function EditProfileScreen() {
  const { user, refreshUser } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(user?.fullName || "");
    setEmail(user?.email || "");
    setCurrentImageUrl(user?.profileImageUrl || "");
    setProfilePhoto(null);
  }, [user]);

  const onPickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission to access media library is required to choose a profile photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85
    });

    if (!result.canceled && result.assets?.length) {
      setProfilePhoto(result.assets[0]);
    }
  }, []);

  const onRemoveImage = useCallback(() => {
    setProfilePhoto(null);
    setCurrentImageUrl("");
  }, []);

  const onSave = useCallback(async () => {
    if (!fullName.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập họ và tên.");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Email không hợp lệ", "Vui lòng nhập email hợp lệ.");
      return;
    }

    if (showPasswordFields) {
      if (!currentPassword.trim()) {
        Alert.alert("Thiếu thông tin", "Vui lòng nhập mật khẩu hiện tại.");
        return;
      }
      if (!newPassword.trim() || newPassword.trim().length < 6) {
        Alert.alert("Mật khẩu mới không hợp lệ", "Mật khẩu mới phải có ít nhất 6 ký tự.");
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert("Xác nhận mật khẩu", "Mật khẩu xác nhận không khớp.");
        return;
      }
    }

    setSaving(true);
    try {
      let profileImageUrl = currentImageUrl;
      if (profilePhoto?.uri) {
        profileImageUrl = await uploadProfileImage(profilePhoto);
      }

      const response = await http.put(API_ENDPOINTS.UPDATE_PROFILE, {
        fullName: fullName.trim(),
        email: email.trim(),
        profileImageUrl,
        currentPassword: showPasswordFields ? currentPassword.trim() : "",
        newPassword: showPasswordFields ? newPassword.trim() : ""
      });

      const nextToken = response?.data?.token;
      if (nextToken) {
        await tokenStorage.setToken(nextToken);
      }

      await refreshUser();
      setProfilePhoto(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordFields(false);
      Alert.alert(SUCCESS_ALERT_TITLE, SUCCESS_ALERT_MESSAGES.update.profile);
    } catch (error) {
      Alert.alert("Cập nhật thất bại", getApiErrorMessage(error, "Không thể cập nhật hồ sơ."));
    } finally {
      setSaving(false);
    }
  }, [
    confirmPassword,
    currentImageUrl,
    currentPassword,
    email,
    fullName,
    newPassword,
    profilePhoto,
    refreshUser,
    showPasswordFields
  ]);

  const previewUri = profilePhoto?.uri || currentImageUrl;

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, getSafeAreaContentStyle(insets)]}>
      <View style={styles.card}>
        <Text style={styles.title}>Chỉnh sửa hồ sơ</Text>
        <Text style={styles.subtitle}>Cập nhật thông tin cá nhân và mật khẩu theo nhu cầu của bạn.</Text>

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

        <Text style={styles.label}>Họ và tên</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Nguyễn Văn A"
          placeholderTextColor={COLORS.DARK_TEXT_SECONDARY}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="tenban@example.com"
          placeholderTextColor={COLORS.DARK_TEXT_SECONDARY}
        />

        {showPasswordFields ? (
          <>
            <Text style={styles.label}>Mật khẩu hiện tại</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder="Nhập mật khẩu hiện tại"
              placeholderTextColor={COLORS.DARK_TEXT_SECONDARY}
            />

            <Text style={styles.label}>Mật khẩu mới</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="Ít nhất 6 ký tự"
              placeholderTextColor={COLORS.DARK_TEXT_SECONDARY}
            />

            <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Nhập lại mật khẩu mới"
              placeholderTextColor={COLORS.DARK_TEXT_SECONDARY}
            />
          </>
        ) : (
          <Pressable style={styles.secondaryButton} onPress={() => setShowPasswordFields(true)}>
            <Text style={styles.secondaryButtonText}>Đổi mật khẩu</Text>
          </Pressable>
        )}

        <Pressable style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={onSave} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG },
  content: { padding: 16, paddingTop: 16 },
  card: {
    backgroundColor: COLORS.CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 16,
    shadowColor: COLORS.BLACK,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
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
  label: {
    color: COLORS.TEXT,
    marginBottom: 8,
    fontWeight: "600",
    fontSize: 14
  },
  input: {
    backgroundColor: COLORS.BG, // input background is soft warm BG
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    color: COLORS.TEXT,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 14
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 94, 131, 0.25)',
    backgroundColor: 'rgba(239, 94, 131, 0.04)',
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 16
  },
  secondaryButtonText: {
    color: COLORS.PRIMARY,
    fontWeight: "700",
    fontSize: 14
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 14,
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
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

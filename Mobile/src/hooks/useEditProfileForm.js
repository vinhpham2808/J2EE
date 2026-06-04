import { useCallback, useContext, useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { AuthContext } from "../contexts/AuthContext";
import { SUCCESS_ALERT_MESSAGES, SUCCESS_ALERT_TITLE } from "../constants/alertMessages";
import { API_ENDPOINTS } from "../constants/api";
import apiClient from "../services/apiClient";
import { tokenStorage } from "../storage/tokenStorage";
import { getApiErrorMessage } from "../utils/format";
import uploadProfileImage from "../utils/profileImage";

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export default function useEditProfileForm() {
  const { user, refreshUser } = useContext(AuthContext);
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

      const response = await apiClient.put(API_ENDPOINTS.UPDATE_PROFILE, {
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

  return {
    confirmPassword,
    currentPassword,
    email,
    fullName,
    newPassword,
    onPickImage,
    onRemoveImage,
    onSave,
    previewUri: profilePhoto?.uri || currentImageUrl,
    saving,
    setConfirmPassword,
    setCurrentPassword,
    setEmail,
    setFullName,
    setNewPassword,
    setShowPasswordFields,
    showPasswordFields
  };
}

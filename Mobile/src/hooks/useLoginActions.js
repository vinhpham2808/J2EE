import { useCallback, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../contexts/AuthContext";
import { getApiErrorMessage } from "../utils/format";
import {
  getActivationEmail,
  isActivationRequiredError,
  openActivationOtp,
} from "../utils/authActivation";
import { tokenStorage } from "../storage/tokenStorage";

export default function useLoginActions() {
  const navigation = useNavigation();
  const { signIn, signInWithGoogle, googleAuthLoading } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const loadRememberPreference = async () => {
      try {
        const remember = await tokenStorage.getRememberPreference();
        if (active) setRememberMe(remember);
      } catch {
        if (active) setRememberMe(false);
      }
    };
    loadRememberPreference();
    return () => { active = false; };
  }, []);

  const onToggleRemember = useCallback(async (value) => {
    setRememberMe(value);
    try {
      await tokenStorage.setRememberPreference(value);
    } catch {
      // ignore
    }
  }, []);

  const showActivationOption = useCallback(
    (activationEmail) => {
      Alert.alert(
        "Tài khoản chưa được kích hoạt",
        "Tài khoản này đã được đăng ký nhưng chưa xác thực OTP. Bạn có muốn tiếp tục kích hoạt tài khoản không?",
        [
          { text: "Để sau", style: "cancel" },
          {
            text: "Xác thực OTP",
            onPress: async () => {
              try {
                await openActivationOtp(navigation, activationEmail);
              } catch (error) {
                const message = getApiErrorMessage(error, "Không thể gửi lại mã OTP. Vui lòng thử lại.");
                Alert.alert("Không thể gửi OTP", message);
              }
            },
          },
        ]
      );
    },
    [navigation]
  );

  const onSubmit = useCallback(async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    setLoading(true);
    try {
      await signIn({ email: normalizedEmail, password, rememberMe });
    } catch (error) {
      const isTimeout = error?.code === "ECONNABORTED";
      const isNetworkError =
        !error?.response && /network|timeout|socket|failed/i.test(String(error?.message || ""));
      const statusCode = error?.response?.status;
      const isServiceUnavailable = [502, 503, 504].includes(statusCode);

      if (isTimeout || isNetworkError || isServiceUnavailable) {
        Alert.alert(
          "Không kết nối được với máy chủ",
          "Hệ thống đang gặp sự cố kết nối. Vui lòng kiểm tra kết nối mạng của bạn hoặc thử lại sau ít phút."
        );
      } else if (statusCode === 403 && isActivationRequiredError(error)) {
        showActivationOption(getActivationEmail(error, normalizedEmail));
      } else {
        const message = getApiErrorMessage(error, "Không thể đăng nhập. Vui lòng kiểm tra lại tài khoản.");
        Alert.alert("Đăng nhập thất bại", message);
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, rememberMe, signIn, showActivationOption]);

  const onGooglePress = useCallback(async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      const message = getApiErrorMessage(error, "Không thể đăng nhập bằng Google. Vui lòng thử lại.");
      Alert.alert("Đăng nhập thất bại", message);
    }
  }, [signInWithGoogle]);

  return {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    loading,
    googleAuthLoading,
    onToggleRemember,
    onSubmit,
    onGooglePress,
  };
}

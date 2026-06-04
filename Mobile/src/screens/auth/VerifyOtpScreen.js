import React, { useState, useEffect } from "react";
import { Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import apiClient from "../../services/apiClient";
import { API_ENDPOINTS } from "../../constants/api";
import { getApiErrorMessage } from "../../utils/format";
import { getRetryAfterSeconds } from "../../utils/authOtp";
import useOtpInput from "../../hooks/useOtpInput";
import useOtpCountdown from "../../hooks/useOtpCountdown";
import OtpInput from "../../components/Otp/OtpInput";
import OtpVerificationLayout from "../../components/Otp/OtpVerificationLayout";

export default function VerifyOtpScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const email = route.params?.email || "";

  const { otp, code, inputRefs, handleChange, handleKeyDown, reset } = useOtpInput();
  const { resendDisabled, countdown, startCountdown, stopCountdown } = useOtpCountdown(
    Number(route.params?.initialCountdown || 0)
  );

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!email) navigation.navigate("Signup");
  }, [email, navigation]);

  const handleSubmit = async () => {
    if (code.length !== 6) {
      setError("Vui lòng nhập đầy đủ mã OTP.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await apiClient.post(API_ENDPOINTS.VERIFY_OTP, { email, otp: code });
      setLoading(false);
      setSuccessMsg("verified");
      setTimeout(() => {
        Alert.alert(
          "Đăng ký thành công",
          "Tài khoản của bạn đã được xác thực. Hãy thiết lập thông tin cá nhân.",
          [{ text: "OK", onPress: () => navigation.navigate("SetupProfile", { email }) }]
        );
      }, 5000);
    } catch (err) {
      setLoading(false);
      setError(getApiErrorMessage(err, "Xác thực thất bại."));
    }
  };

  const handleResend = async () => {
    startCountdown(60);
    setError("");
    setSuccessMsg("");
    reset();

    try {
      await apiClient.post(API_ENDPOINTS.RESEND_OTP, { email });
      Alert.alert("Đã gửi lại", "Mã OTP mới đã được gửi tới email của bạn.");
    } catch (err) {
      const retryAfterSeconds = getRetryAfterSeconds(err);
      if (retryAfterSeconds > 0) {
        startCountdown(retryAfterSeconds);
        return;
      }
      setError(getApiErrorMessage(err, "Gửi lại mã thất bại."));
      stopCountdown();
    }
  };

  const actionDisabled = loading || !!successMsg;

  return (
    <OtpVerificationLayout
      title="Kiểm tra email của bạn"
      subtitle="Vui lòng nhập mã được gửi tới"
      email={email}
      error={error}
      actionLabel="Xác thực"
      actionLoading={loading}
      actionDisabled={actionDisabled}
      onAction={handleSubmit}
      resendDisabled={resendDisabled}
      countdown={countdown}
      onResend={handleResend}
    >
      <OtpInput otp={otp} inputRefs={inputRefs} onChange={handleChange} onKeyDown={handleKeyDown} />
    </OtpVerificationLayout>
  );
}

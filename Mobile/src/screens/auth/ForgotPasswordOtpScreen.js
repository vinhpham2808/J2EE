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

export default function ForgotPasswordOtpScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const email = route.params?.email || "";

  const { otp, code, inputRefs, handleChange, handleKeyDown, reset } = useOtpInput();
  const { resendDisabled, countdown, startCountdown, stopCountdown } = useOtpCountdown();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) navigation.navigate("ForgotPassword");
  }, [email, navigation]);

  const handleSubmit = async () => {
    if (code.length !== 6) {
      setError("Vui lòng nhập đầy đủ mã OTP.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await apiClient.post(API_ENDPOINTS.VERIFY_RESET_OTP, { email, otp: code });
      setLoading(false);
      navigation.navigate("ResetPassword", { email, otp: code });
    } catch (err) {
      setLoading(false);
      setError(getApiErrorMessage(err, "Mã OTP không đúng hoặc đã hết hạn."));
    }
  };

  const handleResend = async () => {
    startCountdown(60);
    setError("");
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

  return (
    <OtpVerificationLayout
      title="Xác thực OTP"
      subtitle="Vui lòng nhập mã OTP được gửi tới"
      email={email}
      error={error}
      actionLabel="Xác thực"
      actionLoading={loading}
      actionDisabled={loading}
      onAction={handleSubmit}
      resendDisabled={resendDisabled}
      countdown={countdown}
      onResend={handleResend}
    >
      <OtpInput otp={otp} inputRefs={inputRefs} onChange={handleChange} onKeyDown={handleKeyDown} />
    </OtpVerificationLayout>
  );
}

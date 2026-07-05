import React, { useState, useEffect } from "react";
import { Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const email = route.params?.email || "";

  const { otp, code, inputRefs, handleChange, handleKeyDown, reset } = useOtpInput();
  const { resendDisabled, countdown, startCountdown, stopCountdown } = useOtpCountdown(
    Number(route.params?.initialCountdown || 0)
  );

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!email) {
      navigation.navigate("Signup");
      return;
    }

    const unsubscribe = navigation.addListener
      ? navigation.addListener("beforeRemove", (e) => {
          if (successMsg) return;

          e.preventDefault();

          Alert.alert(
            t("auth.otp.cancelTitle"),
            t("auth.otp.cancelMessage"),
            [
              { text: t("auth.common.no"), style: "cancel", onPress: () => {} },
              {
                text: t("auth.common.yes"),
                style: "destructive",
                onPress: async () => {
                  try {
                    await apiClient.post(API_ENDPOINTS.CANCEL_REGISTRATION, null, { params: { email } });
                  } catch (err) {
                    console.warn("[VerifyOtpScreen] cancel registration failed:", err);
                  }
                  navigation.dispatch(e.data.action);
                }
              }
            ]
          );
        })
      : () => {};

    return unsubscribe;
  }, [email, navigation, successMsg, t]);

  const handleSubmit = async () => {
    if (code.length !== 6) {
      setError(t("auth.otp.missingCode"));
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
          t("auth.otp.signupSuccessTitle"),
          t("auth.otp.signupSuccessMessage"),
          [{ text: "OK", onPress: () => navigation.navigate("Login") }]
        );
      }, 5000);
    } catch (err) {
      setLoading(false);
      setError(getApiErrorMessage(err, t("auth.otp.verifyFailed")));
    }
  };

  const handleResend = async () => {
    startCountdown(60);
    setError("");
    setSuccessMsg("");
    reset();

    try {
      await apiClient.post(API_ENDPOINTS.RESEND_OTP, { email });
      Alert.alert(t("auth.otp.resentTitle"), t("auth.otp.resentMessage"));
    } catch (err) {
      const retryAfterSeconds = getRetryAfterSeconds(err);
      if (retryAfterSeconds > 0) {
        startCountdown(retryAfterSeconds);
        return;
      }
      setError(getApiErrorMessage(err, t("auth.otp.resendFailed")));
      stopCountdown();
    }
  };

  const actionDisabled = loading || !!successMsg;

  return (
    <OtpVerificationLayout
      title={t("auth.otp.checkEmailTitle")}
      subtitle={t("auth.otp.checkEmailSubtitle")}
      email={email}
      error={error}
      actionLabel={t("auth.common.verify")}
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

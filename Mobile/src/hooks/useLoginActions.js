import { useCallback, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../contexts/AuthContext";
import { getApiErrorMessage } from "../utils/format";
import {
  getActivationEmail,
  isActivationRequiredError,
  openActivationOtp,
} from "../utils/authActivation";
import { tokenStorage } from "../storage/tokenStorage";
import {
  signInWithGoogleNative,
  exchangeGoogleToken,
} from "../services/authGoogleService";

export default function useLoginActions() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { signIn, refreshUser } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);

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
        t("auth.common.activationRequiredTitle"),
        t("auth.signup.activationMessage"),
        [
          { text: t("auth.common.later"), style: "cancel" },
          {
            text: t("auth.common.verifyOtp"),
            onPress: async () => {
              try {
                await openActivationOtp(navigation, activationEmail);
              } catch (error) {
                const message = getApiErrorMessage(error, t("auth.common.resendOtpFailed"));
                Alert.alert(t("auth.common.cannotResendOtp"), message);
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
      Alert.alert(t("auth.signup.missingTitle"), t("auth.login.missingCredentials"));
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
          t("auth.login.connectionErrorTitle"),
          t("auth.login.connectionErrorMsg")
        );
      } else if (statusCode === 403 && isActivationRequiredError(error)) {
        showActivationOption(getActivationEmail(error, normalizedEmail));
      } else {
        const message = getApiErrorMessage(error, t("auth.login.failedMessage"));
        Alert.alert(t("auth.login.failedTitle"), message);
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, rememberMe, signIn, showActivationOption]);

  const onGooglePress = useCallback(async () => {
    setGoogleAuthLoading(true);
    try {
      const googleResult = await signInWithGoogleNative();
      if (!googleResult) return;

      const { idToken } = googleResult;
      const { token, user: profile } = await exchangeGoogleToken(idToken);
      if (!token) return;

      await tokenStorage.setToken(token, { remember: true });

      if (profile) return profile;

      return refreshUser();
    } catch (error) {
      console.error("[onGooglePress] Error details:", error);
      if (error?.message === "SIGN_IN_CANCELLED" || error?.code === "SIGN_IN_CANCELLED") return;
      const message = getApiErrorMessage(error, t("auth.login.failedMessage"));
      Alert.alert(t("auth.login.failedTitle"), message);
    } finally {
      setGoogleAuthLoading(false);
    }
  }, [refreshUser, t]);

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

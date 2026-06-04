import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { API_ENDPOINTS } from "../constants/api";
import apiClient from "../services/apiClient";
import { getApiErrorMessage } from "../utils/format";

export default function useEmailPreferences() {
  const [preferences, setPreferences] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchPreferences = useCallback(async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.GET_EMAIL_PREFERENCES);
      setPreferences(response.data || []);
    } catch (error) {
      console.error("Lỗi lấy cài đặt email:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPreferences();
    }, [fetchPreferences])
  );

  const dailyReportPref = useMemo(
    () => preferences.find((preference) => preference.type === "DAILY_EXPENSE_REPORT"),
    [preferences]
  );

  const toggleDailyEmail = useCallback(
    async (newValue) => {
      if (!dailyReportPref) return;

      const previousPreferences = preferences;
      const updatedPreferences = preferences.map((preference) =>
        preference.type === "DAILY_EXPENSE_REPORT" ? { ...preference, isEnabled: newValue } : preference
      );

      setIsUpdating(true);
      try {
        setPreferences(updatedPreferences);
        await apiClient.put(API_ENDPOINTS.UPDATE_EMAIL_PREFERENCES, updatedPreferences);
      } catch (error) {
        setPreferences(previousPreferences);
        Alert.alert("Lỗi", getApiErrorMessage(error, "Không thể cập nhật cài đặt email."));
      } finally {
        setIsUpdating(false);
      }
    },
    [dailyReportPref, preferences]
  );

  return {
    dailyReportPref,
    isDailyEnabled: dailyReportPref?.isEnabled ?? false,
    isUpdating,
    toggleDailyEmail
  };
}

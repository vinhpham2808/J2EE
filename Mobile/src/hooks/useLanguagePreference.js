import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_LANGUAGE_CODE, getLanguageInfo } from "../constants/languages";

const LANGUAGE_STORAGE_KEY = "selected_language";

export default function useLanguagePreference() {
  const [languageCode, setLanguageCode] = useState(DEFAULT_LANGUAGE_CODE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then((storedLanguage) => {
        if (!mounted || !storedLanguage) return;
        setLanguageCode(getLanguageInfo(storedLanguage).code);
      })
      .finally(() => {
        if (mounted) setLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const changeLanguage = useCallback(async (nextLanguageCode) => {
    const nextLanguage = getLanguageInfo(nextLanguageCode);
    setLanguageCode(nextLanguage.code);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage.code);
    return nextLanguage;
  }, []);

  return {
    languageCode,
    language: getLanguageInfo(languageCode),
    loaded,
    changeLanguage
  };
}

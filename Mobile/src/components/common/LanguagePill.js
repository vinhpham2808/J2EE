import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import useLanguagePreference from "../../hooks/useLanguagePreference";
import { getLanguageInfo } from "../../constants/languages";
import LanguageSelector from "../More/LanguageSelector";

export default function LanguagePill() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { languageCode, changeLanguage } = useLanguagePreference();
  const [modalVisible, setModalVisible] = useState(false);

  const currentLang = getLanguageInfo(languageCode);

  const handleApply = async (code) => {
    await changeLanguage(code);
    setModalVisible(false);
    Alert.alert(t("language.alertTitle"), t("language.changed"));
  };

  return (
    <>
      <View style={[styles.container, { top: insets.top + 8 }]}>
        <Pressable
          onPress={() => setModalVisible(true)}
          style={({ pressed }) => [
            styles.pill,
            pressed && styles.pillPressed,
          ]}
        >
          <Text style={styles.flag}>{currentLang.flag}</Text>
          <Text style={styles.label}>{currentLang.shortLabel}</Text>
        </Pressable>
      </View>

      <LanguageSelector
        visible={modalVisible}
        selectedLanguageCode={languageCode}
        onClose={() => setModalVisible(false)}
        onApply={handleApply}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 16,
    zIndex: 100,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#D6F5E5",
  },
  pillPressed: {
    opacity: 0.8,
  },
  flag: {
    fontSize: 16,
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1B5E20",
  },
});

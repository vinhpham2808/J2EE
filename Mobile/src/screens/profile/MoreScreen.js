import React, { useContext, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../../contexts/AuthContext";
import { useTheme, THEME_MODES } from "../../contexts/ThemeContext";
import MoreSettings, { LogoutButton } from "../../components/More/MoreSettings";
import LanguageSelector from "../../components/More/LanguageSelector";
import ProfileHero from "../../components/More/ProfileHero";
import { useAppColors } from "../../constants/colors";
import useEmailPreferences from "../../hooks/useEmailPreferences";
import useLanguagePreference from "../../hooks/useLanguagePreference";
import { getSafeAreaContentStyle } from "../../utils/safeArea";

export default function MoreScreen() {
  const navigation = useNavigation();
  const { user, signOut } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const [appNotifications, setAppNotifications] = useState(true);
  const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false);
  const [languageToast, setLanguageToast] = useState("");
  const emailPreferences = useEmailPreferences();
  const languagePreference = useLanguagePreference();

  const isDark = theme === THEME_MODES.DARK;

  useEffect(() => {
    if (!languageToast) return undefined;
    const timer = setTimeout(() => setLanguageToast(""), 2200);
    return () => clearTimeout(timer);
  }, [languageToast]);

  const handleItemPress = (item) => {
    if (item.key === "language") {
      setLanguageSelectorVisible(true);
      return;
    }
    if (item.key === "about") {
      Alert.alert(
        "Về ứng dụng Money Manager",
        "Phiên bản: 1.5\n\nNền tảng tài chính thông minh nhất giúp bạn theo dõi chi tiêu, tiết kiệm và đầu tư hiệu quả cho tương lai.\n\nThiết kế bởi BotDev Team.",
        [{ text: "Đóng", style: "cancel" }]
      );
      return;
    }
    if (!item.route) return;
    navigation.navigate(item.route, item.params);
  };

  const handleApplyLanguage = async (languageCode) => {
    setLanguageSelectorVisible(false);
    const nextLanguage = await languagePreference.changeLanguage(languageCode);
    setLanguageToast(nextLanguage.changedMessage);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.BG }]}> 
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, getSafeAreaContentStyle(insets)]} showsVerticalScrollIndicator={false}>
        <ProfileHero user={user} onPress={() => navigation.navigate("Profile")} />

        <MoreSettings
          appNotifications={appNotifications}
          emailPreferences={emailPreferences}
          isDark={isDark}
          languageLabel={languagePreference.language.settingsLabel}
          onAppNotificationsChange={setAppNotifications}
          onThemeChange={toggleTheme}
          onItemPress={handleItemPress}
        />

        <LogoutButton onPress={signOut} />
      </ScrollView>

      <LanguageSelector
        visible={languageSelectorVisible}
        selectedLanguageCode={languagePreference.languageCode}
        onClose={() => setLanguageSelectorVisible(false)}
        onApply={handleApplyLanguage}
      />

      {languageToast ? (
        <View style={[styles.languageToast, { bottom: Math.max(insets.bottom, 8) + 10 }]}> 
          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
          <Text style={styles.languageToastText}>{languageToast}</Text>
          <Pressable onPress={() => setLanguageToast("")} hitSlop={10}>
            <Ionicons name="close" size={16} color="rgba(255,255,255,0.86)" />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  languageToast: {
    position: "absolute",
    left: 18,
    right: 18,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  languageToastText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});

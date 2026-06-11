import React, { useContext, useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
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
import darkModeIcon from "../../assets/accessories/dark-mode.png";

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
          languageLabel={languagePreference.language.settingsLabel}
          onAppNotificationsChange={setAppNotifications}
          onItemPress={handleItemPress}
        />

        <View style={[styles.themeCard, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}> 
          <View style={styles.themeRow}>
            <View style={styles.themeLeft}>
              <View style={styles.iconWrap}>
                <Image source={darkModeIcon} style={styles.themeIconImage} resizeMode="contain" />
              </View>
              <View>
                <Text style={[styles.themeTitle, { color: colors.TEXT }]}>Giao diện tối</Text>
                <Text style={[styles.themeSubtitle, { color: colors.TEXT_SECONDARY }]}> 
                  {isDark ? "Đang bật chế độ tối" : "Đang bật chế độ sáng"}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.CARD_BORDER, true: colors.ACTION_VOICE || '#A855F7' }}
              thumbColor={colors.WHITE}
            />
          </View>
        </View>

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
  themeCard: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  themeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  themeIconImage: {
    width: 26,
    height: 26,
  },
  themeTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  themeSubtitle: {
    fontSize: 12,
    marginTop: 2,
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

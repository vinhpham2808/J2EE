import React, { useContext, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../../contexts/AuthContext";
import { useTheme, THEME_MODES } from "../../contexts/ThemeContext";
import MoreSettings, { LogoutButton } from "../../components/More/MoreSettings";
import ProfileHero from "../../components/More/ProfileHero";
import { useAppColors } from "../../constants/colors";
import useEmailPreferences from "../../hooks/useEmailPreferences";
import { getSafeAreaContentStyle } from "../../utils/safeArea";

export default function MoreScreen() {
  const navigation = useNavigation();
  const { user, signOut } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const [appNotifications, setAppNotifications] = useState(true);
  const emailPreferences = useEmailPreferences();

  const isDark = theme === THEME_MODES.DARK;

  const handleItemPress = (item) => {
    if (!item.route) return;
    navigation.navigate(item.route, item.params);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.BG }]} contentContainerStyle={[styles.content, getSafeAreaContentStyle(insets)]} showsVerticalScrollIndicator={false}>
      <ProfileHero user={user} onPress={() => navigation.navigate("Profile")} />

      <MoreSettings
        appNotifications={appNotifications}
        emailPreferences={emailPreferences}
        onAppNotificationsChange={setAppNotifications}
        onItemPress={handleItemPress}
      />

      {/* ─── Theme Toggle Section ─── */}
      <View style={[styles.themeCard, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}>
        <View style={styles.themeRow}>
          <View style={styles.themeLeft}>
            <Text style={styles.themeIcon}>{isDark ? "🌙" : "☀️"}</Text>
            <View>
              <Text style={[styles.themeTitle, { color: colors.TEXT }]}>Dark Mode</Text>
              <Text style={[styles.themeSubtitle, { color: colors.TEXT_SECONDARY }]}>
                {isDark ? "Dark mode is on" : "Light mode is on"}
              </Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.CARD_BORDER, true: colors.PRIMARY }}
            thumbColor={colors.WHITE}
          />
        </View>
      </View>

      <LogoutButton onPress={signOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  themeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  themeIcon: {
    fontSize: 22,
  },
  themeTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  themeSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});

import React, { useContext, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../../contexts/AuthContext";
import MoreSettings, { LogoutButton } from "../../components/More/MoreSettings";
import ProfileHero from "../../components/More/ProfileHero";
import { COLORS } from "../../constants/colors";
import useEmailPreferences from "../../hooks/useEmailPreferences";
import { getSafeAreaContentStyle } from "../../utils/safeArea";

export default function MoreScreen() {
  const navigation = useNavigation();
  const { user, signOut } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [appNotifications, setAppNotifications] = useState(true);
  const emailPreferences = useEmailPreferences();

  const handleItemPress = (item) => {
    if (!item.route) return;
    navigation.navigate(item.route, item.params);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, getSafeAreaContentStyle(insets)]} showsVerticalScrollIndicator={false}>
      <ProfileHero user={user} onPress={() => navigation.navigate("Profile")} />

      <MoreSettings
        appNotifications={appNotifications}
        emailPreferences={emailPreferences}
        onAppNotificationsChange={setAppNotifications}
        onItemPress={handleItemPress}
      />

      <LogoutButton onPress={signOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 90
  }
});

import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useAppColors } from "../../constants/colors";
import { getSafeAreaBottom, getSafeAreaTop } from "../../utils/safeArea";
import ScreenBackHeader from "../../components/common/ScreenBackHeader";

const HELP_ITEMS = [
  // {
  //   key: "userGuide",
  //   icon: "help-circle-outline",
  //   url: "https://moneymanager.example.com/guide"
  // },
  {
    key: "website",
    icon: "globe-outline",
    url: "https://moneymanager.example.com"
  },
  {
    key: "followFacebook",
    icon: "logo-facebook",
    url: "https://www.facebook.com/profile.php?id=61579017999960"
  }
  // {
  //   key: "dataProtection",
  //   icon: "shield-checkmark-outline",
  //   url: "https://www.privacypolicies.com/live/c9bcdecb-94c6-422f-a464-143a10f62e33"
  // }
];

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const { t } = useTranslation();

  const handleItemPress = (item) => {
    if (item.url) {
      Linking.openURL(item.url);
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.BG, paddingTop: getSafeAreaTop(insets, 0) }]}>
      <ScreenBackHeader title={t("help.title")} style={styles.screenHeader} />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.BG }]}
        contentContainerStyle={[styles.content, { paddingBottom: getSafeAreaBottom(insets) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.listCard, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}>
          {HELP_ITEMS.map((item, index) => {
            const isLast = index === HELP_ITEMS.length - 1;

            return (
              <Pressable
                key={item.key}
                style={({ pressed }) => [
                  styles.itemRow,
                  { borderBottomColor: colors.BG },
                  !isLast && styles.itemRowBorder,
                  pressed && styles.itemRowPressed
                ]}
                onPress={() => handleItemPress(item)}
              >
                <View style={styles.itemLeft}>
                  <View style={styles.itemIconWrap}>
                    <Ionicons name={item.icon} size={22} color={colors.ACTION_VOICE || "#A855F7"} />
                  </View>
                  <Text style={[styles.itemTitle, { color: colors.TEXT }]}>
                    {t(`help.${item.key}`)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.TEXT_MUTED} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  screenHeader: {
    marginBottom: 8
  },
  container: {
    flex: 1
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 4
  },
  listCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2
    },
    elevation: 2
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  itemRowBorder: {
    borderBottomWidth: 1
  },
  itemRowPressed: {
    opacity: 0.7
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(168, 85, 247, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1
  }
});

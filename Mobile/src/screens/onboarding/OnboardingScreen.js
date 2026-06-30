import React, { useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import appLogo from "../../assets/logo&banner/applogo.png";
import { COLORS, useAppColors } from "../../constants/colors";
import { scale, clampScale, useDynamicViewport } from "../../utils/layoutScale";
import AppIcon from "../../components/ui/AppIcon";
import LanguagePill from "../../components/common/LanguagePill";

export const ONBOARDING_KEY = "botdev_onboarding_done";

const SLIDES = [
  {
    id: "plan",
    titleKey: "onboarding.slides.planTitle",
    subtitleKey: "onboarding.slides.planSubtitle",
    icon: "wallet",
    glowColor: "rgba(124, 77, 255, 0.12)",
    iconColor: "#7C4DFF",
  },
  {
    id: "insight",
    titleKey: "onboarding.slides.insightTitle",
    subtitleKey: "onboarding.slides.insightSubtitle",
    icon: "mic",
    glowColor: "rgba(249, 115, 22, 0.12)",
    iconColor: "#F97316",
  },
  {
    id: "control",
    titleKey: "onboarding.slides.controlTitle",
    subtitleKey: "onboarding.slides.controlSubtitle",
    icon: "flag",
    glowColor: "rgba(59, 130, 246, 0.12)",
    iconColor: "#3B82F6",
  }
];

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const listRef = useRef(null);
  const colors = useAppColors();
  const [currentIndex, setCurrentIndex] = useState(0);
  const lastIndex = SLIDES.length - 1;
  const isLastSlide = currentIndex === lastIndex;
  const { width: viewportWidth } = useDynamicViewport();

  const dots = useMemo(
    () =>
      SLIDES.map((slide, index) => (
        <View 
          key={slide.id} 
          style={[
            styles.dot, 
            { backgroundColor: colors.BORDER || "#E5E7EB" },
            index === currentIndex && [styles.dotActive, { backgroundColor: "#3B82F6" }]
          ]} 
        />
      )),
    [currentIndex, colors.BORDER]
  );

  const finishOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "1");
    navigation.replace("Login");
  };

  const handleNext = async () => {
    if (isLastSlide) {
      await finishOnboarding();
      return;
    }

    const nextIndex = currentIndex + 1;
    listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setCurrentIndex(nextIndex);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems[0]?.index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <View style={[styles.container, { backgroundColor: colors.APP_BACKGROUND || "#F2F2F7" }]}>
      <LanguagePill />

      {/* Premium Gradient blob design */}
      <LinearGradient
        colors={['rgba(124, 77, 255, 0.15)', 'rgba(79, 172, 254, 0.05)']}
        style={styles.bgGlowTop}
      />

      <View style={styles.headerRow}>
        <Image source={appLogo} style={styles.brandLogo} resizeMode="contain" />
        <Pressable onPress={finishOnboarding}>
          <Text style={[styles.skipText, { color: colors.TEXT_SECONDARY || "#6B7280" }]}>{t("onboarding.skip")}</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: viewportWidth - scale(40) }]}>
            <View style={[styles.iconBubble, { backgroundColor: item.glowColor, borderColor: item.iconColor }]}>
              <AppIcon name={item.icon} size={scale(44)} color={item.iconColor} />
            </View>
            <Text style={[styles.title, { color: colors.TEXT || "#1C1C1E" }]}>{t(item.titleKey)}</Text>
            <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY || "#6B7280" }]}>{t(item.subtitleKey)}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dotsRow}>{dots}</View>
        <Pressable style={[styles.ctaButton, { backgroundColor: "#3B82F6" }]} onPress={handleNext}>
          <Text style={styles.ctaText}>{isLastSlide ? t("onboarding.start") : t("onboarding.continue")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: scale(24),
    paddingBottom: scale(26)
  },
  bgGlowTop: {
    position: "absolute",
    top: -90,
    left: -80,
    width: scale(300),
    height: scale(300),
    borderRadius: scale(150),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  brandLogo: {
    width: scale(40),
    aspectRatio: 1
  },
  skipText: {
    fontSize: clampScale(14, 12, 16),
    fontWeight: "600"
  },
  slide: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(12)
  },
  iconBubble: {
    width: scale(110),
    aspectRatio: 1,
    borderRadius: scale(55),
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(26),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontSize: clampScale(28, 24, 32),
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.3
  },
  subtitle: {
    marginTop: scale(12),
    textAlign: "center",
    lineHeight: scale(22),
    fontSize: clampScale(15, 13, 17)
  },
  footer: {
    marginTop: scale(18)
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: scale(9),
    marginBottom: scale(20)
  },
  dot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
  },
  dotActive: {
    width: scale(18),
  },
  ctaButton: {
    borderRadius: scale(12),
    paddingVertical: scale(14),
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: clampScale(15, 13, 17)
  }
});

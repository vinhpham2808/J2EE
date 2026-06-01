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
import AsyncStorage from "@react-native-async-storage/async-storage";
import appLogo from "../assets/applogo.png";
import { COLORS } from "../constants/colors";
import { scale, clampScale, useDynamicViewport } from "../utils/dimensions";

export const ONBOARDING_KEY = "botdev_onboarding_done";

const SLIDES = [
  {
    id: "plan",
    title: "Theo Dõi Mọi Dòng Tiền",
    subtitle: "Quản lý thu chi trong một giao diện gọn gàng, dễ theo dõi."
  },
  {
    id: "insight",
    title: "Nhận Biết Nhanh Xu Hướng",
    subtitle: "Xem thống kê trực quan để đưa ra quyết định tài chính nhanh hơn."
  },
  {
    id: "control",
    title: "Chủ Động Tài Chính",
    subtitle: "Đặt mục tiêu, giữ ngân sách và tăng trưởng cùng botdev."
  }
];

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const listRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const lastIndex = SLIDES.length - 1;
  const isLastSlide = currentIndex === lastIndex;
  const { width: viewportWidth } = useDynamicViewport();

  const dots = useMemo(
    () =>
      SLIDES.map((slide, index) => (
        <View key={slide.id} style={[styles.dot, index === currentIndex && styles.dotActive]} />
      )),
    [currentIndex]
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
    <View style={styles.container}>
      <View style={styles.bgGlowTop} />
      <View style={styles.bgGlowBottom} />

      <View style={styles.headerRow}>
        <Image source={appLogo} style={styles.brandLogo} resizeMode="contain" />
        <Pressable onPress={finishOnboarding}>
          <Text style={styles.skipText}>Bỏ qua</Text>
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
            <View style={styles.iconBubble}>
              <Text style={styles.iconText}>$</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dotsRow}>{dots}</View>
        <Pressable style={styles.ctaButton} onPress={handleNext}>
          <Text style={styles.ctaText}>{isLastSlide ? "Bắt đầu" : "Tiếp tục"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.DARK_BG,
    paddingHorizontal: scale(20),
    paddingTop: scale(18),
    paddingBottom: scale(26)
  },
  bgGlowTop: {
    position: "absolute",
    top: -90,
    left: -80,
    width: scale(260),
    height: scale(260),
    borderRadius: scale(130),
    backgroundColor: COLORS.PRIMARY_GLOW
  },
  bgGlowBottom: {
    position: "absolute",
    right: -120,
    bottom: -90,
    width: scale(280),
    height: scale(280),
    borderRadius: scale(140),
    backgroundColor: COLORS.PRIMARY_GLOW
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
    color: COLORS.DARK_TEXT_SECONDARY,
    fontSize: clampScale(14, 12, 16),
    fontWeight: "600"
  },
  slide: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(12)
  },
  iconBubble: {
    width: scale(120),
    aspectRatio: 1,
    borderRadius: scale(60),
    borderWidth: 1,
    borderColor: COLORS.PRIMARY_GLOW_STRONG,
    backgroundColor: COLORS.PRIMARY_GLOW,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(26)
  },
  iconText: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: clampScale(52, 40, 60),
    fontWeight: "800"
  },
  title: {
    color: COLORS.DARK_TEXT,
    fontSize: clampScale(30, 24, 34),
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.3
  },
  subtitle: {
    marginTop: scale(12),
    color: COLORS.DARK_TEXT_SECONDARY,
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
    backgroundColor: COLORS.DARK_BORDER
  },
  dotActive: {
    width: scale(18),
    backgroundColor: COLORS.PRIMARY
  },
  ctaButton: {
    borderRadius: scale(12),
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: scale(14),
    alignItems: "center"
  },
  ctaText: {
    color: COLORS.DARK_TEXT,
    fontWeight: "800",
    fontSize: clampScale(15, 13, 17)
  }
});
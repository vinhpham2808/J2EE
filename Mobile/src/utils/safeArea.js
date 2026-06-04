import { Platform, StatusBar } from "react-native";

export const SCREEN_TOP_GAP = 16;
export const TAB_BAR_BOTTOM_GAP = 110;

export function getSafeAreaTop(insets, gap = SCREEN_TOP_GAP) {
  const statusBarTop = Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;
  return Math.max(insets?.top || 0, statusBarTop) + gap;
}

export function getSafeAreaBottom(insets, gap = TAB_BAR_BOTTOM_GAP) {
  return (insets?.bottom || 0) + gap;
}

export function getSafeAreaContentStyle(insets, options = {}) {
  const { top = SCREEN_TOP_GAP, bottom = TAB_BAR_BOTTOM_GAP } = options;

  return {
    paddingTop: getSafeAreaTop(insets, top),
    paddingBottom: getSafeAreaBottom(insets, bottom),
  };
}

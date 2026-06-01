import { Dimensions, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Kích thước chuẩn thiết kế cơ sở (ví dụ: iPhone 11/12/13/14 là 375x812)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

const { width: initWidth, height: initHeight } = Dimensions.get("window");

// Các hàm tiện ích dùng static (không qua hook, dùng ở StyleSheet.create trực tiếp)
export const scale = (size) => (initWidth / BASE_WIDTH) * size;
export const verticalScale = (size) => (initHeight / BASE_HEIGHT) * size;
export const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

export const clamp = (minVal, val, maxVal) => Math.min(Math.max(val, minVal), maxVal);

export const clampScale = (size, minVal, maxVal, factor = 0.5) => {
  const scaled = moderateScale(size, factor);
  return clamp(minVal, scaled, maxVal);
};

export const min = (val1, val2) => Math.min(val1, val2);
export const max = (val1, val2) => Math.max(val1, val2);

export const vw = (percentage) => (initWidth * percentage) / 100;
export const vh = (percentage) => (initHeight * percentage) / 100;

/**
 * Hook trả về thông tin Viewport động đầy đủ và tự động cập nhật khi xoay màn hình
 * hoặc thay đổi insets an toàn (notch, bottom bar).
 */
export function useDynamicViewport() {
  const { width, height } = useWindowDimensions();
  const rawInsets = useSafeAreaInsets();
  const insets = rawInsets || { top: 0, bottom: 0, left: 0, right: 0 };

  // Chiều cao an toàn thực tế trừ đi tai thỏ (top) và thanh điều hướng (bottom)
  const safeHeight = height - (insets.top || 0) - (insets.bottom || 0);

  // Phiên bản động của các hàm scale tương thích với sự xoay màn hình
  const dynamicScale = (size) => (width / BASE_WIDTH) * size;
  const dynamicVerticalScale = (size) => (height / BASE_HEIGHT) * size;
  const dynamicModerateScale = (size, factor = 0.5) => size + (dynamicScale(size) - size) * factor;
  const dynamicClampScale = (size, minVal, maxVal, factor = 0.5) => {
    return clamp(minVal, dynamicModerateScale(size, factor), maxVal);
  };

  const dynamicVw = (percentage) => (width * percentage) / 100;
  const dynamicVh = (percentage) => (height * percentage) / 100;

  return {
    width,
    height,
    safeHeight,
    insets,
    scale: dynamicScale,
    verticalScale: dynamicVerticalScale,
    moderateScale: dynamicModerateScale,
    clampScale: dynamicClampScale,
    vw: dynamicVw,
    vh: dynamicVh,
  };
}

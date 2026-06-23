let mockPlatformOS = "ios";
let mockStatusBarHeight = 0;

jest.mock("react-native", () => ({
  Platform: {
    get OS() { return mockPlatformOS; },
  },
  StatusBar: {
    get currentHeight() { return mockStatusBarHeight; },
  },
}));

import { getSafeAreaTop, getSafeAreaBottom, getSafeAreaContentStyle } from "../safeArea";

beforeEach(() => {
  mockPlatformOS = "ios";
  mockStatusBarHeight = 0;
});

describe("getSafeAreaTop", () => {
  test("returns insets.top + gap on iOS", () => {
    expect(getSafeAreaTop({ top: 44 }, 16)).toBe(60);
  });

  test("includes StatusBar.currentHeight on Android", () => {
    mockPlatformOS = "android";
    mockStatusBarHeight = 24;
    expect(getSafeAreaTop({ top: 0 }, 16)).toBe(40);
  });

  test("uses max of insets.top and statusBarHeight on Android", () => {
    mockPlatformOS = "android";
    mockStatusBarHeight = 24;
    expect(getSafeAreaTop({ top: 44 }, 16)).toBe(60);
  });

  test("uses default SCREEN_TOP_GAP when gap not provided", () => {
    expect(getSafeAreaTop({ top: 44 })).toBe(60);
  });
});

describe("getSafeAreaBottom", () => {
  test("returns insets.bottom + gap", () => {
    expect(getSafeAreaBottom({ bottom: 34 }, 16)).toBe(50);
  });

  test("uses default TAB_BAR_BOTTOM_GAP when gap not provided", () => {
    expect(getSafeAreaBottom({ bottom: 0 })).toBe(110);
  });
});

describe("getSafeAreaContentStyle", () => {
  test("returns paddingTop and paddingBottom", () => {
    const style = getSafeAreaContentStyle({ top: 44, bottom: 34 });
    expect(style.paddingTop).toBe(60);
    expect(style.paddingBottom).toBe(144);
  });

  test("accepts custom gaps via options", () => {
    const style = getSafeAreaContentStyle({ top: 44, bottom: 34 }, { top: 10, bottom: 20 });
    expect(style.paddingTop).toBe(54);
    expect(style.paddingBottom).toBe(54);
  });
});

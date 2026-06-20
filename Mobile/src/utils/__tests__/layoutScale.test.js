jest.mock("react-native", () => ({
  Dimensions: {
    get: () => ({ width: 375, height: 812 }),
  },
  useWindowDimensions: jest.fn(),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: jest.fn(),
}));

import { scale, verticalScale, moderateScale, clamp, clampScale, min, max, vw, vh } from "../layoutScale";

describe("scale", () => {
  test("returns same size when width equals base (375)", () => {
    expect(scale(16)).toBe(16);
  });

  test("scales proportionally", () => {
    expect(scale(10)).toBe(10);
  });
});

describe("verticalScale", () => {
  test("returns same size when height equals base (812)", () => {
    expect(verticalScale(16)).toBe(16);
  });
});

describe("moderateScale", () => {
  test("returns size when width is base width", () => {
    expect(moderateScale(16, 0.5)).toBe(16);
  });
});

describe("clamp", () => {
  test("returns val when within range", () => {
    expect(clamp(10, 15, 20)).toBe(15);
  });

  test("returns min when val below range", () => {
    expect(clamp(10, 5, 20)).toBe(10);
  });

  test("returns max when val above range", () => {
    expect(clamp(10, 25, 20)).toBe(20);
  });
});

describe("clampScale", () => {
  test("clamps scaled value within range", () => {
    expect(clampScale(16, 12, 20)).toBeGreaterThanOrEqual(12);
    expect(clampScale(16, 12, 20)).toBeLessThanOrEqual(20);
  });
});

describe("min / max", () => {
  test("min returns smaller value", () => {
    expect(min(5, 10)).toBe(5);
  });

  test("max returns larger value", () => {
    expect(max(5, 10)).toBe(10);
  });
});

describe("vw / vh", () => {
  test("vw returns percentage of width", () => {
    expect(vw(50)).toBe(187.5);
  });

  test("vh returns percentage of height", () => {
    expect(vh(50)).toBe(406);
  });
});

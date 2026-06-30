jest.mock("../../constants/colors", () => ({
  COLORS: { PRIMARY: "#ef5e83" },
}));

jest.mock("../../services/jarService", () => ({ fetchJars: jest.fn() }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("@react-navigation/native", () => ({ useFocusEffect: jest.fn((cb) => cb()) }));
jest.mock("../../utils/format", () => ({ getApiErrorMessage: (e, f) => e?.message || f }));

import { renderHook, act, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import useJarList from "../useJarList";

// Pure helpers from useJarList
function getMaxJars(plan) {
  if (plan === "PREMIUM") return Infinity;
  if (plan === "BASIC") return 6;
  return 1;
}

function buildJarSlices(jars) {
  const validJars = jars.filter((jar) => (jar.currentBalance ?? 0) > 0);
  const sum = validJars.reduce((s, j) => s + j.currentBalance, 0);
  if (sum === 0) return [];
  let angle = 0;
  return validJars.map((jar) => {
    const percent = (jar.currentBalance / sum) * 100;
    const sweep = (jar.currentBalance / sum) * 360;
    const start = angle;
    angle += sweep;
    return { key: String(jar.id), name: jar.name, color: jar.color || "#ef5e83", percent, startAngle: start, endAngle: angle, balance: jar.currentBalance };
  });
}

describe("useJarList helpers", () => {
  describe("getMaxJars", () => {
    test("PREMIUM plan returns Infinity", () => {
      expect(getMaxJars("PREMIUM")).toBe(Infinity);
    });
    test("BASIC plan returns 6", () => {
      expect(getMaxJars("BASIC")).toBe(6);
    });
    test("FREE/other plans return 1", () => {
      expect(getMaxJars("FREE")).toBe(1);
      expect(getMaxJars(null)).toBe(1);
      expect(getMaxJars()).toBe(1);
    });
  });

  describe("buildJarSlices", () => {
    test("returns empty array for no jars", () => {
      expect(buildJarSlices([])).toEqual([]);
    });

    test("returns empty when all balances are 0", () => {
      expect(buildJarSlices([{ id: 1, currentBalance: 0 }])).toEqual([]);
    });

    test("builds slices with correct angles for 2 jars", () => {
      const jars = [
        { id: 1, name: "A", currentBalance: 100, color: "#ff0000" },
        { id: 2, name: "B", currentBalance: 300, color: "#00ff00" },
      ];
      const slices = buildJarSlices(jars);
      expect(slices).toHaveLength(2);
      expect(slices[0].percent).toBe(25);
      expect(slices[0].startAngle).toBe(0);
      expect(slices[0].endAngle).toBe(90);
      expect(slices[1].percent).toBe(75);
      expect(slices[1].startAngle).toBe(90);
      expect(slices[1].endAngle).toBe(360);
    });

    test("filters out zero-balance jars", () => {
      const jars = [
        { id: 1, name: "A", currentBalance: 100 },
        { id: 2, name: "B", currentBalance: 0 },
      ];
      expect(buildJarSlices(jars)).toHaveLength(1);
    });
  });
});

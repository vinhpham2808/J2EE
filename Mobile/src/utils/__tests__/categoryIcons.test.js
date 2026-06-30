import {
  CATEGORY_ICON_PRESETS,
  getCategoryIconPresets,
  getFirstCategoryIcon,
  getIconLabel,
  getIconLocaleKey,
  getIconColor,
} from "../categoryIcons";

describe("CATEGORY_ICON_PRESETS", () => {
  test("has income and expense presets", () => {
    expect(CATEGORY_ICON_PRESETS.income).toHaveLength(12);
    expect(CATEGORY_ICON_PRESETS.expense).toHaveLength(15);
  });

  test("each preset has value, iconName, color, label, localeKey", () => {
    [...CATEGORY_ICON_PRESETS.income, ...CATEGORY_ICON_PRESETS.expense].forEach((p) => {
      expect(p).toHaveProperty("value");
      expect(p).toHaveProperty("iconName");
      expect(p).toHaveProperty("color");
      expect(p).toHaveProperty("label");
      expect(p).toHaveProperty("localeKey");
    });
  });
});

describe("getCategoryIconPresets", () => {
  test("returns income presets for income type", () => {
    expect(getCategoryIconPresets("income")).toBe(CATEGORY_ICON_PRESETS.income);
  });

  test("returns expense presets for expense type", () => {
    expect(getCategoryIconPresets("expense")).toBe(CATEGORY_ICON_PRESETS.expense);
  });

  test("defaults to expense presets for unknown type", () => {
    expect(getCategoryIconPresets("unknown")).toBe(CATEGORY_ICON_PRESETS.expense);
  });
});

describe("getFirstCategoryIcon", () => {
  test("returns first income icon value", () => {
    expect(getFirstCategoryIcon("income")).toBe("mdi:cash-multiple");
  });

  test("returns first expense icon value", () => {
    expect(getFirstCategoryIcon("expense")).toBe("mdi:noodles");
  });
});

describe("getIconLabel", () => {
  test("returns label for known icon value", () => {
    expect(getIconLabel("mdi:cash-multiple")).toBe("Cash");
    expect(getIconLabel("mdi:car")).toBe("Transport");
  });

  test("returns null for unknown icon value", () => {
    expect(getIconLabel("mdi:unknown")).toBeNull();
  });

  test("returns null for empty input", () => {
    expect(getIconLabel("")).toBeNull();
  });
});

describe("getIconLocaleKey", () => {
  test("returns localeKey for known icon value", () => {
    expect(getIconLocaleKey("mdi:cash-multiple")).toBe("iconLabels.cash");
  });

  test("returns null for unknown icon value", () => {
    expect(getIconLocaleKey("mdi:unknown")).toBeNull();
  });
});

describe("getIconColor", () => {
  test("returns color for known icon value", () => {
    expect(getIconColor("mdi:cash-multiple")).toBe("#16a34a");
  });

  test("returns default color for unknown icon value", () => {
    expect(getIconColor("mdi:unknown")).toBe("#344054");
  });

  test("returns default color for empty input", () => {
    expect(getIconColor("")).toBe("#344054");
  });
});

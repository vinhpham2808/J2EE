jest.mock("i18next", () => ({
  t: (key) => {
    const dict = {
      "alertConfig.defaultTitle": "Thông báo",
      "alertConfig.defaultButton": "Đóng",
    };
    return dict[key] || key;
  },
}));

jest.mock("../../constants/colors", () => ({
  COLORS: {
    INCOME_LIGHT: "#E8F5F3",
    EXPENSE_LIGHT: "#FDE8E3",
    WARNING: "#FFB84D",
    WARNING_LIGHT: "#FFF3E0",
    ROSE_MIST: "#FFE4EA",
    INFO: "#6B9BD2",
    INFO_LIGHT: "#E8F0FE",
    TEXT: "#1A0F14",
  },
}));

jest.mock("../../assets/alert/success.png", () => "success-img");
jest.mock("../../assets/alert/error.png", () => "error-img");
jest.mock("../../assets/alert/warning.png", () => "warning-img");
jest.mock("../../assets/alert/confirm.png", () => "confirm-img");
jest.mock("../../assets/alert/information.png", () => "info-img");

import {
  DEFAULT_ALERT_TITLE,
  DEFAULT_ALERT_BUTTON_TEXT,
  APP_ALERT_VARIANTS,
  resolveAlertVariant,
} from "../appAlertConfig";

describe("APP_ALERT_VARIANTS", () => {
  test("has all 5 variant keys", () => {
    expect(APP_ALERT_VARIANTS).toHaveProperty("success");
    expect(APP_ALERT_VARIANTS).toHaveProperty("error");
    expect(APP_ALERT_VARIANTS).toHaveProperty("warning");
    expect(APP_ALERT_VARIANTS).toHaveProperty("confirm");
    expect(APP_ALERT_VARIANTS).toHaveProperty("info");
  });

  test("each variant has accent, soft, glow, title", () => {
    Object.values(APP_ALERT_VARIANTS).forEach((v) => {
      expect(v).toHaveProperty("accent");
      expect(v).toHaveProperty("soft");
      expect(v).toHaveProperty("glow");
      expect(v).toHaveProperty("title");
    });
  });
});

describe("DEFAULT_ALERT_TITLE / DEFAULT_ALERT_BUTTON_TEXT", () => {
  test("returns i18n translated values", () => {
    expect(DEFAULT_ALERT_TITLE()).toBe("Thông báo");
    expect(DEFAULT_ALERT_BUTTON_TEXT()).toBe("Đóng");
  });
});

describe("resolveAlertVariant", () => {
  test("returns 'confirm' when destructive button present", () => {
    expect(resolveAlertVariant("Delete", "Are you sure?", [{ style: "destructive" }])).toBe("confirm");
  });

  test("returns 'confirm' when keywords match", () => {
    expect(resolveAlertVariant("Xác nhận", "Bạn có chắc?")).toBe("confirm");
  });

  test("returns 'error' for error keywords", () => {
    expect(resolveAlertVariant("Lỗi", "Đã xảy ra lỗi")).toBe("error");
    expect(resolveAlertVariant("Thất bại", "")).toBe("error");
  });

  test("returns 'warning' for warning keywords", () => {
    expect(resolveAlertVariant("Thiếu thông tin", "")).toBe("warning");
    expect(resolveAlertVariant("Sai định dạng", "")).toBe("warning");
  });

  test("returns 'success' for success keywords", () => {
    expect(resolveAlertVariant("Thành công", "Hoàn tất")).toBe("success");
  });

  test("returns 'info' as default fallback", () => {
    expect(resolveAlertVariant("Just", "some info")).toBe("info");
  });
});

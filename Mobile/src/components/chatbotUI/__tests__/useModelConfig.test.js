import React from "react";
import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import useModelConfig from "../useModelConfig";
import { AuthContext } from "../../../contexts/AuthContext";

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn(),
    signOut: jest.fn(),
    isSignedIn: jest.fn(),
    getTokens: jest.fn(),
  },
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "chatbot.inputAction": "Nhập yêu cầu trợ lý...",
        "chatbot.inputChat": "Trò chuyện với Nova...",
        "chatbot.basicRequiredTitle": "Tính năng Premium",
        "chatbot.basicRequiredMsg": "Vui lòng nâng cấp gói để dùng Trợ lý AI",
        "common.close": "Đóng",
      };
      return dict[key] || key;
    },
  }),
}));

// Mock Alert
jest.spyOn(Alert, "alert").mockImplementation(() => {});

describe("useModelConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createWrapper = (userValue) => {
    return ({ children }) => (
      <AuthContext.Provider value={{ user: userValue }}>
        {children}
      </AuthContext.Provider>
    );
  };

  test("returns correct values for Free user", () => {
    const wrapper = createWrapper({ subscriptionPlan: "FREE" });
    const { result } = renderHook(() => useModelConfig(), { wrapper });

    expect(result.current.isFreePlan).toBe(true);
    expect(result.current.isPremiumPlan).toBe(false);
    expect(result.current.activeMode).toBe("chat");
    expect(result.current.activeProvider).toBe("gemini");
    expect(result.current.activeModel).toBe("gemini-3.1-flash-lite");
    expect(result.current.inputPlaceholder).toBe("Trò chuyện với Nova...");
  });

  test("returns correct values for Premium user", () => {
    const wrapper = createWrapper({ subscriptionPlan: "PREMIUM" });
    const { result } = renderHook(() => useModelConfig(), { wrapper });

    expect(result.current.isFreePlan).toBe(false);
    expect(result.current.isPremiumPlan).toBe(true);
    // Premium user gets GPT-OSS in chat mode
    expect(result.current.activeProvider).toBe("gptoss");
    expect(result.current.activeModel).toBe("gpt-oss-120b");
  });

  test("prevents switching to agent mode if user is Free", () => {
    const wrapper = createWrapper({ subscriptionPlan: "FREE" });
    const { result } = renderHook(() => useModelConfig(), { wrapper });

    act(() => {
      result.current.handleModeSwitch("agent");
    });

    // Should call alert
    expect(Alert.alert).toHaveBeenCalledWith(
      "Tính năng Premium",
      "Vui lòng nâng cấp gói để dùng Trợ lý AI",
      expect.any(Array)
    );
    // Mode should remain chat
    expect(result.current.activeMode).toBe("chat");
  });

  test("allows switching to agent mode if user is Premium", () => {
    const wrapper = createWrapper({ subscriptionPlan: "PREMIUM" });
    const { result } = renderHook(() => useModelConfig(), { wrapper });

    act(() => {
      result.current.handleModeSwitch("agent");
    });

    // Should switch mode and model
    expect(result.current.activeMode).toBe("agent");
    expect(result.current.activeProvider).toBe("gemini");
    expect(result.current.activeModel).toBe("gemini-3.1-flash-lite");
    expect(result.current.inputPlaceholder).toBe("Nhập yêu cầu trợ lý...");
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});

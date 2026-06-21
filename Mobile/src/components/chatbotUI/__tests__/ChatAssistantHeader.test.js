import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ChatAssistantHeader from "../ChatAssistantHeader";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "chatAssistant.autoTitle": "Trợ lý tự động",
        "chatAssistant.title": "Trò chuyện Nova",
        "chatAssistant.online": "Đang hoạt động",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 30, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    PRIMARY: "#EF5E83",
    BG: "#FFFFFF",
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    TEXT_MUTED: "#B8A6AC",
    ROSE_MIST: "#FFE4EA",
    INCOME: "#4CDAD9",
    WHITE: "#FFFFFF",
  },
  useAppColors: () => ({
    PRIMARY: "#EF5E83",
    BG: "#FFFFFF",
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    TEXT_MUTED: "#B8A6AC",
    ROSE_MIST: "#FFE4EA",
    INCOME: "#4CDAD9",
    WHITE: "#FFFFFF",
  }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("../ModeSegmentedControl", () => "ModeSegmentedControl");
jest.mock("../../../assets/logo&banner/applogo.png", () => "applogo.png");

describe("ChatAssistantHeader", () => {
  const defaultProps = {
    activeMode: "chat",
    isFreePlan: false,
    modelLabel: "Gemini Pro",
    onChangeMode: jest.fn(),
    onOpenSessions: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders active chat mode title, online status, and model label", () => {
    const { getByText, getByLabelText } = render(
      <ChatAssistantHeader {...defaultProps} />
    );

    expect(getByText("Trò chuyện Nova")).toBeTruthy();
    expect(getByText("Đang hoạt động")).toBeTruthy();
    expect(getByText("Gemini Pro")).toBeTruthy();

    const historyBtn = getByLabelText("Open chat history");
    fireEvent.press(historyBtn);
    expect(defaultProps.onOpenSessions).toHaveBeenCalledTimes(1);
  });

  test("renders active agent mode title", () => {
    const { getByText } = render(
      <ChatAssistantHeader {...defaultProps} activeMode="agent" />
    );

    expect(getByText("Trợ lý tự động")).toBeTruthy();
  });

  test("does not render history button if onOpenSessions is not provided", () => {
    const { queryByLabelText } = render(
      <ChatAssistantHeader {...defaultProps} onOpenSessions={undefined} />
    );

    expect(queryByLabelText("Open chat history")).toBeNull();
  });
});

const mockNavigate = jest.fn();
let mockRouteName = "JarScreen";

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ name: mockRouteName }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const templates = {
        "finance.jar.title": "Hũ tài chính",
        "finance.jar.listTitle": "Danh sách các hũ",
        "finance.jar.emptyTitle": "Không có hũ nào",
        "finance.jar.emptyDescription": "Hãy tạo hũ đầu tiên để phân bổ",
        "finance.jar.firstAction": "Tạo hũ ngay",
        "finance.jar.transfer": "Chuyển tiền hũ",
        "finance.jar.create": "Tạo mới hũ",
        "finance.jar.limitTitle": "Giới hạn số hũ",
        "finance.jar.limitMessage": `Bạn đã đạt giới hạn tối đa ${options?.maxJars} hũ của gói ${options?.plan}`,
        "finance.jar.upgradeNow": "Nâng cấp ngay",
        "auth.common.later": "Để sau",
      };
      return templates[key] || key;
    },
  }),
}));

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    BG: "#FFF",
    TEXT: "#000",
    PRIMARY: "#ef5e83",
    ROSE_MIST: "rgba(239,94,131,0.1)",
    CARD_BORDER: "#EEE",
  }),
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (s) => s,
}));

jest.mock("../../../utils/safeArea", () => ({
  getSafeAreaTop: () => 40,
  getSafeAreaBottom: () => 20,
}));

// Mock AuthContext
jest.mock("../../../contexts/AuthContext", () => {
  const React = require("react");
  const AuthContext = React.createContext({ user: { id: "u1" } });
  return {
    AuthContext,
    AuthProvider: ({ children }) =>
      React.createElement(AuthContext.Provider, { value: { user: { id: "u1" } } }, children),
  };
});

// Mock hook
const mockJarList = {
  jars: [{ id: "j1", name: "Necessities", balance: 5000000 }],
  canCreate: true,
  maxJars: 6,
  plan: "FREE",
  totalBalance: 10000000,
  totalPercentage: 50,
  slices: [],
  refreshing: false,
  loading: false,
  onRefresh: jest.fn(),
};
jest.mock("../../../hooks/useJarList", () => () => mockJarList);

// Mock subcomponents
jest.mock("../../../components/ui/AppIcon", () => "AppIcon");
jest.mock("../../../components/common/ScreenBackHeader", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return ({ title }) =>
    React.createElement(View, { testID: "screen-header" }, React.createElement(Text, null, title));
});

jest.mock("../../../components/ui/EmptyState", () => {
  const React = require("react");
  const { TouchableOpacity, Text, View } = require("react-native");
  return ({ title, description, onActionPress, actionTitle }) =>
    React.createElement(
      View,
      { testID: "empty-state" },
      React.createElement(Text, null, title),
      React.createElement(Text, null, description),
      React.createElement(
        TouchableOpacity,
        { testID: "empty-state-action", onPress: onActionPress },
        React.createElement(Text, null, actionTitle)
      )
    );
});

jest.mock("../../../components/Jars/JarAllocationChart", () => () => {
  const React = require("react");
  const { View } = require("react-native");
  return React.createElement(View, { testID: "jar-chart" });
});

jest.mock("../../../components/Jars/JarCard", () => {
  const React = require("react");
  const { TouchableOpacity, Text } = require("react-native");
  return ({ item, onPress }) =>
    React.createElement(
      TouchableOpacity,
      { testID: `jar-card-${item.id}`, onPress },
      React.createElement(Text, null, item.name)
    );
});

jest.mock("../../../components/Jars/JarOverview", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return ({ jarCount }) =>
    React.createElement(
      View,
      { testID: "jar-overview" },
      React.createElement(Text, null, `Jars: ${jarCount}`)
    );
});

// Route subviews mocks
jest.mock("../../../components/Jars/JarDetailView", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return () => React.createElement(View, { testID: "jar-detail-view" }, React.createElement(Text, null, "DetailView"));
});

jest.mock("../../../components/Jars/JarFormView", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return () => React.createElement(View, { testID: "jar-form-view" }, React.createElement(Text, null, "FormView"));
});

jest.mock("../../../components/Jars/JarTransferView", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return () => React.createElement(View, { testID: "jar-transfer-view" }, React.createElement(Text, null, "TransferView"));
});

import React from "react";
import { Alert } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import JarScreen from "../JarScreen";

describe("JarScreen", () => {
  const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteName = "JarScreen";
    mockJarList.jars = [{ id: "j1", name: "Necessities", balance: 5000000 }];
    mockJarList.canCreate = true;
  });

  it("renders JarDetailView subroute when route.name is JarDetail", () => {
    mockRouteName = "JarDetail";
    const { getByTestId, queryByTestId } = render(<JarScreen />);
    expect(getByTestId("jar-detail-view")).toBeTruthy();
    expect(queryByTestId("screen-header")).toBeNull();
  });

  it("renders JarFormView subroute when route.name is JarForm", () => {
    mockRouteName = "JarForm";
    const { getByTestId, queryByTestId } = render(<JarScreen />);
    expect(getByTestId("jar-form-view")).toBeTruthy();
    expect(queryByTestId("screen-header")).toBeNull();
  });

  it("renders JarTransferView subroute when route.name is JarTransfer", () => {
    mockRouteName = "JarTransfer";
    const { getByTestId, queryByTestId } = render(<JarScreen />);
    expect(getByTestId("jar-transfer-view")).toBeTruthy();
    expect(queryByTestId("screen-header")).toBeNull();
  });

  it("renders JarListRoute successfully with list of jars", () => {
    mockRouteName = "JarScreen";
    const { getByTestId, getByText, queryByTestId } = render(<JarScreen />);

    expect(getByTestId("screen-header")).toBeTruthy();
    expect(getByText("Hũ tài chính")).toBeTruthy();
    expect(getByTestId("jar-overview")).toBeTruthy();
    expect(getByText("Jars: 1")).toBeTruthy();
    expect(getByTestId("jar-chart")).toBeTruthy();
    expect(getByTestId("jar-card-j1")).toBeTruthy();
    expect(getByText("Necessities")).toBeTruthy();
    expect(getByText("Danh sách các hũ")).toBeTruthy();
    expect(queryByTestId("empty-state")).toBeNull();
  });

  it("navigates to JarDetail screen on jar card click", () => {
    const { getByTestId } = render(<JarScreen />);
    fireEvent.press(getByTestId("jar-card-j1"));
    expect(mockNavigate).toHaveBeenCalledWith("JarDetail", { id: "j1", name: "Necessities" });
  });

  it("shows JarActions secondary button when jarCount is 2 or more", () => {
    mockJarList.jars = [
      { id: "j1", name: "Necessities" },
      { id: "j2", name: "Education" },
    ];
    const { getByText } = render(<JarScreen />);
    expect(getByText("Chuyển tiền hũ")).toBeTruthy();

    fireEvent.press(getByText("Chuyển tiền hũ"));
    expect(mockNavigate).toHaveBeenCalledWith("JarTransfer");
  });

  it("navigates to JarForm screen on create press if jarList.canCreate is true", () => {
    const { getByText } = render(<JarScreen />);
    fireEvent.press(getByText("Tạo mới hũ"));
    expect(mockNavigate).toHaveBeenCalledWith("JarForm");
  });

  it("shows Alert dialog on create press if jarList.canCreate is false", () => {
    mockJarList.canCreate = false;
    mockJarList.maxJars = 3;
    mockJarList.plan = "BASIC";

    const { getByText } = render(<JarScreen />);
    fireEvent.press(getByText("Tạo mới hũ"));

    expect(alertSpy).toHaveBeenCalledWith(
      "Giới hạn số hũ",
      "Bạn đã đạt giới hạn tối đa 3 hũ của gói BASIC",
      [
        { text: "Để sau", style: "cancel" },
        { text: "Nâng cấp ngay", onPress: expect.any(Function) },
      ]
    );

    // Click upgrade button on Alert
    const upgradeBtn = alertSpy.mock.calls[0][2][1];
    upgradeBtn.onPress();
    expect(mockNavigate).toHaveBeenCalledWith("SettingTab", { screen: "Payment" });
  });

  it("renders EmptyState when jars list is empty", () => {
    mockJarList.jars = [];
    const { getByTestId, queryByTestId, getByText } = render(<JarScreen />);

    expect(queryByTestId("jar-card-j1")).toBeNull();
    expect(getByTestId("empty-state")).toBeTruthy();
    expect(getByText("Không có hũ nào")).toBeTruthy();

    // Trigger action from empty state
    fireEvent.press(getByTestId("empty-state-action"));
    expect(mockNavigate).toHaveBeenCalledWith("JarForm");
  });
});

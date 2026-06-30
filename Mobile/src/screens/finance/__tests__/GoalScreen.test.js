jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const templates = {
        "finance.goal.title": "Mục tiêu tài chính",
        "finance.goal.planTag": "Kế hoạch",
        "finance.goal.count": `${options?.count || 0} đang hoạt động`,
        "finance.goal.overviewTitle": "Tổng quan mục tiêu",
        "finance.goal.saved": "Đã tích lũy",
        "finance.goal.target": "Mục tiêu cần đạt",
        "finance.goal.completed": "Đã hoàn thành",
        "finance.goal.listTitle": "Danh sách mục tiêu",
        "finance.goal.emptyTitle": "Không có mục tiêu nào",
        "finance.goal.emptyDescription": "Bạn chưa tạo mục tiêu nào",
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
    WHITE: "#FFF",
    PRIMARY_GRADIENT: ["#ef5e83", "#f190ab"],
  }),
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (s) => s,
}));

jest.mock("../../../utils/safeArea", () => ({
  getSafeAreaTop: () => 40,
  getSafeAreaBottom: () => 20,
}));

jest.mock("../../../utils/format", () => ({
  formatMoney: (val) => `${val} ₫`,
}));

// Mock hook
const mockGoalsHook = {
  goals: [],
  refreshing: false,
  visibleGoals: [],
  canExpandGoals: false,
  showAllGoals: false,
  toggleGoals: jest.fn(),
  onRefresh: jest.fn(),
  overview: {
    activeCount: 0,
    totalCurrent: 0,
    totalTarget: 0,
    overallProgress: 0,
  },
  name: "",
  targetAmount: "",
  startDate: "",
  targetDate: "",
  loading: false,
  setName: jest.fn(),
  setTargetAmount: jest.fn(),
  setStartDate: jest.fn(),
  setTargetDate: jest.fn(),
  onCreate: jest.fn(),
  detailGoal: null,
  setDetailGoal: jest.fn(),
  onDelete: jest.fn(),
  selectedGoal: null,
  contributionAmount: "",
  contributionDate: "",
  contributionNote: "",
  setContributionAmount: jest.fn(),
  setContributionDate: jest.fn(),
  setContributionNote: jest.fn(),
  openContributionModal: jest.fn(),
  closeContributionModal: jest.fn(),
  onContribute: jest.fn(),
};

jest.mock("../../../hooks/useGoals", () => () => mockGoalsHook);

// Mock expo-linear-gradient
jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LinearGradient: ({ children, style }) => React.createElement(View, { testID: "linear-gradient", style }, children),
  };
});

// Mock subcomponents
jest.mock("../../../components/ui/AppIcon", () => "AppIcon");

jest.mock("../../../components/common/ScreenBackHeader", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return ({ title }) => React.createElement(View, { testID: "screen-header" }, React.createElement(Text, null, title));
});

jest.mock("../../../components/common/ShowMoreButton", () => {
  const React = require("react");
  const { TouchableOpacity, Text } = require("react-native");
  return ({ visible, expanded, onPress }) =>
    visible
      ? React.createElement(
          TouchableOpacity,
          { testID: "show-more-button", onPress },
          React.createElement(Text, null, expanded ? "Show Less" : "Show More")
        )
      : null;
});

jest.mock("../../../components/Goal/GoalForm", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity, TextInput } = require("react-native");
  return ({ name, targetAmount, onSubmit, onNameChange, onAmountChange }) =>
    React.createElement(
      View,
      { testID: "goal-form" },
      React.createElement(TextInput, { testID: "goal-form-name-input", value: name, onChangeText: onNameChange }),
      React.createElement(TextInput, { testID: "goal-form-amount-input", value: String(targetAmount || ""), onChangeText: onAmountChange }),
      React.createElement(TouchableOpacity, { testID: "goal-form-submit", onPress: onSubmit }, React.createElement(Text, null, "Create Goal"))
    );
});

jest.mock("../../../components/Goal/CompactGoalTab", () => {
  const React = require("react");
  const { TouchableOpacity, Text } = require("react-native");
  return ({ item, onPress }) =>
    React.createElement(
      TouchableOpacity,
      { testID: `compact-goal-tab-${item.id}`, onPress: () => onPress(item) },
      React.createElement(Text, null, item.name)
    );
});

jest.mock("../../../components/Goal/GoalDetailModal", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity } = require("react-native");
  return ({ goal, visible, onClose, onContribute, onDelete }) =>
    visible && goal
      ? React.createElement(
          View,
          { testID: "goal-detail-modal" },
          React.createElement(Text, null, goal.name),
          React.createElement(TouchableOpacity, { testID: "goal-detail-close", onPress: onClose }, React.createElement(Text, null, "Close")),
          React.createElement(TouchableOpacity, { testID: "goal-detail-contribute", onPress: () => onContribute(goal) }, React.createElement(Text, null, "Contribute")),
          React.createElement(TouchableOpacity, { testID: "goal-detail-delete", onPress: () => onDelete(goal.id) }, React.createElement(Text, null, "Delete"))
        )
      : null;
});

jest.mock("../../../components/Goal/ContributionModal", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity, TextInput } = require("react-native");
  return ({ visible, goal, amount, note, onAmountChange, onNoteChange, onClose, onSubmit }) =>
    visible && goal
      ? React.createElement(
          View,
          { testID: "contribution-modal" },
          React.createElement(Text, null, `Contribute to ${goal.name}`),
          React.createElement(TextInput, { testID: "contrib-amount-input", value: String(amount || ""), onChangeText: onAmountChange }),
          React.createElement(TextInput, { testID: "contrib-note-input", value: note, onChangeText: onNoteChange }),
          React.createElement(TouchableOpacity, { testID: "contrib-close", onPress: onClose }, React.createElement(Text, null, "Close")),
          React.createElement(TouchableOpacity, { testID: "contrib-submit", onPress: onSubmit }, React.createElement(Text, null, "Submit"))
        )
      : null;
});

jest.mock("../../../components/ui/EmptyState", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return ({ title, description }) =>
    React.createElement(
      View,
      { testID: "empty-state" },
      React.createElement(Text, null, title),
      React.createElement(Text, null, description)
    );
});

import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import GoalScreen from "../GoalScreen";

describe("GoalScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGoalsHook.goals = [];
    mockGoalsHook.visibleGoals = [];
    mockGoalsHook.refreshing = false;
    mockGoalsHook.canExpandGoals = false;
    mockGoalsHook.showAllGoals = false;
    mockGoalsHook.overview = {
      activeCount: 0,
      totalCurrent: 0,
      totalTarget: 0,
      overallProgress: 0,
    };
    mockGoalsHook.name = "";
    mockGoalsHook.targetAmount = "";
    mockGoalsHook.detailGoal = null;
    mockGoalsHook.selectedGoal = null;
    mockGoalsHook.contributionAmount = "";
    mockGoalsHook.contributionNote = "";
  });

  it("renders overview metrics and empty state successfully when there are no goals", () => {
    const { getByTestId, getByText, getAllByText, queryByTestId } = render(<GoalScreen />);

    expect(getByTestId("screen-header")).toBeTruthy();
    expect(getByText("Mục tiêu tài chính")).toBeTruthy();
    expect(getByText("Tổng quan mục tiêu")).toBeTruthy();
    
    // Default values in overview card
    expect(getByText("0 đang hoạt động")).toBeTruthy();
    expect(getAllByText("0 ₫").length).toBeGreaterThan(0);
    expect(getByText("0%")).toBeTruthy();

    // Empty state
    expect(getByTestId("empty-state")).toBeTruthy();
    expect(getByText("Không có mục tiêu nào")).toBeTruthy();
    expect(getByText("Bạn chưa tạo mục tiêu nào")).toBeTruthy();

    expect(queryByTestId("show-more-button")).toBeNull();
  });

  it("renders active goal metrics and goal list when goals exist", () => {
    mockGoalsHook.goals = [{ id: "1", name: "Buy Laptop" }];
    mockGoalsHook.visibleGoals = [{ id: "1", name: "Buy Laptop" }];
    mockGoalsHook.overview = {
      activeCount: 1,
      totalCurrent: 5000000,
      totalTarget: 20000000,
      overallProgress: 25,
    };

    const { getByTestId, getByText, queryByTestId } = render(<GoalScreen />);

    expect(getByText("1 đang hoạt động")).toBeTruthy();
    expect(getByText("5000000 ₫")).toBeTruthy();
    expect(getByText("20000000 ₫")).toBeTruthy();
    expect(getByText("25%")).toBeTruthy();

    expect(getByTestId("compact-goal-tab-1")).toBeTruthy();
    expect(getByText("Buy Laptop")).toBeTruthy();
    expect(queryByTestId("empty-state")).toBeNull();
  });

  it("handles expand and collapse toggle when canExpandGoals is true", () => {
    mockGoalsHook.goals = [
      { id: "1", name: "Buy Laptop" },
      { id: "2", name: "Travel" },
    ];
    mockGoalsHook.visibleGoals = [{ id: "1", name: "Buy Laptop" }];
    mockGoalsHook.canExpandGoals = true;
    mockGoalsHook.showAllGoals = false;

    const { getByTestId } = render(<GoalScreen />);
    const showMoreBtn = getByTestId("show-more-button");
    expect(showMoreBtn).toBeTruthy();

    fireEvent.press(showMoreBtn);
    expect(mockGoalsHook.toggleGoals).toHaveBeenCalled();
  });

  it("allows setting inputs on GoalForm and calling onCreate", () => {
    const { getByTestId } = render(<GoalScreen />);
    const nameInput = getByTestId("goal-form-name-input");
    const amountInput = getByTestId("goal-form-amount-input");
    const submitBtn = getByTestId("goal-form-submit");

    act(() => {
      fireEvent.changeText(nameInput, "Buy Car");
      fireEvent.changeText(amountInput, "500000000");
    });

    expect(mockGoalsHook.setName).toHaveBeenCalledWith("Buy Car");
    expect(mockGoalsHook.setTargetAmount).toHaveBeenCalledWith("500000000");

    fireEvent.press(submitBtn);
    expect(mockGoalsHook.onCreate).toHaveBeenCalled();
  });

  it("interacts with GoalDetailModal and handles actions (Close, Contribute, Delete)", () => {
    const goalMock = { id: "1", name: "Buy Laptop", currentAmount: 5000000 };
    mockGoalsHook.detailGoal = goalMock;

    const { getByTestId, getByText } = render(<GoalScreen />);
    expect(getByTestId("goal-detail-modal")).toBeTruthy();
    expect(getByText("Buy Laptop")).toBeTruthy();

    // Trigger contribute click inside modal
    fireEvent.press(getByTestId("goal-detail-contribute"));
    expect(mockGoalsHook.openContributionModal).toHaveBeenCalledWith(goalMock);

    // Trigger delete click
    fireEvent.press(getByTestId("goal-detail-delete"));
    expect(mockGoalsHook.onDelete).toHaveBeenCalledWith("1");

    // Close modal
    fireEvent.press(getByTestId("goal-detail-close"));
    expect(mockGoalsHook.setDetailGoal).toHaveBeenCalledWith(null);
  });

  it("interacts with ContributionModal and updates values", () => {
    const goalMock = { id: "2", name: "Travel" };
    mockGoalsHook.selectedGoal = goalMock;
    mockGoalsHook.contributionAmount = "1000000";
    mockGoalsHook.contributionNote = "Saving weekly";

    const { getByTestId, getByText } = render(<GoalScreen />);
    expect(getByTestId("contribution-modal")).toBeTruthy();
    expect(getByText("Contribute to Travel")).toBeTruthy();

    const amountInput = getByTestId("contrib-amount-input");
    const noteInput = getByTestId("contrib-note-input");

    act(() => {
      fireEvent.changeText(amountInput, "1500000");
      fireEvent.changeText(noteInput, "Bonus saving");
    });

    expect(mockGoalsHook.setContributionAmount).toHaveBeenCalledWith("1500000");
    expect(mockGoalsHook.setContributionNote).toHaveBeenCalledWith("Bonus saving");

    fireEvent.press(getByTestId("contrib-submit"));
    expect(mockGoalsHook.onContribute).toHaveBeenCalled();

    fireEvent.press(getByTestId("contrib-close"));
    expect(mockGoalsHook.closeContributionModal).toHaveBeenCalled();
  });
});

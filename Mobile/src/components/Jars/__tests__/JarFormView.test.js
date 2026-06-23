import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import JarFormView from "../JarFormView";
import apiClient from "../../../services/apiClient";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockParams = {};

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: mockParams,
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 20, bottom: 20, left: 0, right: 0 }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const dict = {
        "jarForm.createTitle": "Tạo hũ mới",
        "jarForm.editTitle": "Sửa hũ",
        "jarForm.jarName": "Tên hũ",
        "jarForm.jarNamePlaceholder": "Nhập tên hũ...",
        "jarForm.iconLabel": "Biểu tượng",
        "jarForm.iconHint": "Nhấn để đổi biểu tượng",
        "jarForm.percentageLabel": "Tỷ lệ phân bổ mục tiêu",
        "jarForm.percentagePlaceholder": "Nhập tỷ lệ (%)...",
        "jarForm.colorLabel": "Màu sắc",
        "jarForm.parentWalletName": "Ví tổng",
        "jarForm.parentWalletInfo": "Ví tổng tự động tích lũy số dư còn lại.",
        "jarForm.createSave": "Lưu hũ mới",
        "jarForm.updateSave": "Lưu thay đổi",
        "jarForm.saving": "Đang lưu...",
        "jarForm.missingNameTitle": "Thiếu tên hũ",
        "jarForm.missingNameMsg": "Vui lòng nhập tên hũ.",
        "jarForm.invalidPctTitle": "Tỷ lệ không hợp lệ",
        "jarForm.invalidPctMsg": "Tỷ lệ phải từ 0% đến 100%.",
        "jarForm.successCreateTitle": "Tạo hũ thành công",
        "jarForm.successCreateMsg": "Hũ đã được thêm mới.",
        "jarForm.successUpdateTitle": "Cập nhật thành công",
        "jarForm.successUpdateMsg": "Thông tin hũ đã được lưu.",
        "jarForm.errorTitle": "Lỗi",
        "jarForm.errorMsg": "Không thể lưu hũ.",
        "jarForm.modalTitle": "Chọn biểu tượng",
        "jarForm.close": "Đóng",
        "jarForm.catFinance": "Tài chính",
      };
      return dict[key] || key;
    },
  }),
}));

jest.mock("../../../services/apiClient", () => ({
  post: jest.fn(),
  put: jest.fn(),
}));

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    TEXT_MUTED: "#B8A6AC",
    BG: "#F9F9FA",
    PRIMARY: "#8B5CF6",
    INFO_LIGHT: "#EBF5FF",
    BORDER: "#D1D5DB",
  }),
}));

jest.mock("../../../utils/safeArea", () => ({
  getSafeAreaContentStyle: (insets) => ({ paddingTop: insets.top, paddingBottom: insets.bottom }),
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (val) => val,
}));

jest.mock("../../common/ScreenBackHeader", () => "ScreenBackHeader");

describe("JarFormView", () => {
  beforeEach(() => {
    mockParams = {};
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  test("renders empty create form, validates input field changes", () => {
    const { getByPlaceholderText, getByText } = render(<JarFormView />);

    expect(getByText("Tên hũ")).toBeTruthy();
    expect(getByText("Biểu tượng")).toBeTruthy();
    expect(getByText("Tỷ lệ phân bổ mục tiêu")).toBeTruthy();
    expect(getByText("Màu sắc")).toBeTruthy();

    const nameInput = getByPlaceholderText("Nhập tên hũ...");
    expect(nameInput.props.value).toBe("");
    fireEvent.changeText(nameInput, "Mua sắm");
    expect(nameInput.props.value).toBe("Mua sắm");

    const percentageInput = getByPlaceholderText("Nhập tỷ lệ (%)...");
    expect(percentageInput.props.value).toBe("");
    fireEvent.changeText(percentageInput, "15");
    expect(percentageInput.props.value).toBe("15");
  });

  test("shows alert error when name is missing", () => {
    const { getByText } = render(<JarFormView />);
    const saveBtn = getByText("Lưu hũ mới");
    fireEvent.press(saveBtn);

    expect(Alert.alert).toHaveBeenCalledWith("Thiếu tên hũ", "Vui lòng nhập tên hũ.");
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  test("shows alert error when target percentage is out of range 0-100", () => {
    const { getByPlaceholderText, getByText } = render(<JarFormView />);
    
    fireEvent.changeText(getByPlaceholderText("Nhập tên hũ..."), "Mua sắm");
    fireEvent.changeText(getByPlaceholderText("Nhập tỷ lệ (%)..."), "120");

    const saveBtn = getByText("Lưu hũ mới");
    fireEvent.press(saveBtn);

    expect(Alert.alert).toHaveBeenCalledWith("Tỷ lệ không hợp lệ", "Tỷ lệ phải từ 0% đến 100%.");
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  test("successfully submits POST request to create a new jar", async () => {
    apiClient.post.mockResolvedValueOnce({ data: { success: true } });

    const { getByPlaceholderText, getByText } = render(<JarFormView />);
    
    fireEvent.changeText(getByPlaceholderText("Nhập tên hũ..."), "Ăn uống");
    fireEvent.changeText(getByPlaceholderText("Nhập tỷ lệ (%)..."), "20");

    const saveBtn = getByText("Lưu hũ mới");
    fireEvent.press(saveBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/jars", {
        name: "Ăn uống",
        icon: "🏺",
        color: "#8B5CF6",
        targetPercentage: 20,
      });
      expect(Alert.alert).toHaveBeenCalledWith("Tạo hũ thành công", "Hũ đã được thêm mới.");
      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });
  });

  test("renders edit form prefilled with initialData", () => {
    mockParams = {
      isEditing: true,
      initialData: {
        id: 5,
        name: "Du lịch",
        icon: "✈️",
        color: "#EF4444",
        targetPercentage: 10,
      },
    };

    const { getByPlaceholderText, getByText } = render(<JarFormView />);

    const nameInput = getByPlaceholderText("Nhập tên hũ...");
    expect(nameInput.props.value).toBe("Du lịch");

    const percentageInput = getByPlaceholderText("Nhập tỷ lệ (%)...");
    expect(percentageInput.props.value).toBe("10");

    expect(getByText("Lưu thay đổi")).toBeTruthy();
  });

  test("successfully submits PUT request to edit an existing jar", async () => {
    apiClient.put.mockResolvedValueOnce({ data: { success: true } });
    mockParams = {
      isEditing: true,
      initialData: {
        id: 5,
        name: "Du lịch",
        icon: "✈️",
        color: "#EF4444",
        targetPercentage: 10,
      },
    };

    const { getByPlaceholderText, getByText } = render(<JarFormView />);
    
    fireEvent.changeText(getByPlaceholderText("Nhập tên hũ..."), "Du lịch hè");
    fireEvent.changeText(getByPlaceholderText("Nhập tỷ lệ (%)..."), "15");

    const saveBtn = getByText("Lưu thay đổi");
    fireEvent.press(saveBtn);

    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith("/jars/5", {
        name: "Du lịch hè",
        icon: "✈️",
        color: "#EF4444",
        targetPercentage: 15,
      });
      expect(Alert.alert).toHaveBeenCalledWith("Cập nhật thành công", "Thông tin hũ đã được lưu.");
      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });
  });

  test("renders Parent Wallet name and hides target percentage input", () => {
    mockParams = {
      isEditing: true,
      initialData: {
        id: 1,
        name: "Ví tổng",
        icon: "💳",
        color: "#8B5CF6",
        targetPercentage: 0,
      },
    };

    const { getByPlaceholderText, getByText, queryByPlaceholderText } = render(<JarFormView />);

    expect(getByPlaceholderText("Nhập tên hũ...").props.value).toBe("Ví tổng");
    expect(queryByPlaceholderText("Nhập tỷ lệ (%)...")).toBeNull();
    expect(getByText("Ví tổng tự động tích lũy số dư còn lại.")).toBeTruthy();
  });

  test("opens emoji picker modal, selects an emoji and closes", () => {
    const { getByText, queryByText } = render(<JarFormView />);

    // Click on emoji bubble to open modal
    fireEvent.press(getByText("🏺"));
    expect(getByText("Chọn biểu tượng")).toBeTruthy();

    // Select "🐖" (it should be in catFinance category list emojis)
    fireEvent.press(getByText("🐖"));
    expect(queryByText("Chọn biểu tượng")).toBeNull(); // Modal closed

    // Emoji bubble now displays selected emoji
    expect(getByText("🐖")).toBeTruthy();
  });
});

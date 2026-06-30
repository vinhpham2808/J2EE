import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { Pressable } from "react-native";
import EditProfileScreen from "../EditProfileScreen";
import useEditProfileForm from "../../../hooks/useEditProfileForm";

// Mock safe-area context
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 20, left: 0, right: 0 }),
}));

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        "editProfile.title": "Chỉnh sửa trang cá nhân",
        "editProfile.subtitle": "Cập nhật thông tin của bạn",
        "editProfile.save": "Lưu thay đổi",
        "editProfile.saving": "Đang lưu...",
      };
      return dict[key] || key;
    },
  }),
}));

// Mock app colors constant and hook
jest.mock("../../../constants/colors", () => ({
  COLORS: {
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    PRIMARY: "#EF5E83",
    BG: "#FFFFFF",
  },
  useAppColors: () => ({
    CARD: "#FFFFFF",
    CARD_BORDER: "#E5E7EB",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    PRIMARY: "#EF5E83",
    BG: "#FFFFFF",
  }),
}));

// Mock safeArea utility
jest.mock("../../../utils/safeArea", () => ({
  getSafeAreaContentStyle: jest.fn(() => ({ paddingTop: 10, paddingBottom: 20 })),
}));

// Mock components
jest.mock("../../../components/Profile/PasswordChangeFields", () => {
  const React = require("react");
  const { View } = require("react-native");
  return jest.fn((props) => <View {...props} testID="PasswordChangeFields" />);
});

jest.mock("../../../components/Profile/ProfileAvatarPicker", () => {
  const React = require("react");
  const { View } = require("react-native");
  return jest.fn((props) => <View {...props} testID="ProfileAvatarPicker" />);
});

jest.mock("../../../components/Profile/ProfileInfoFields", () => {
  const React = require("react");
  const { View } = require("react-native");
  return jest.fn((props) => <View {...props} testID="ProfileInfoFields" />);
});

jest.mock("../../../components/common/ScreenBackHeader", () => {
  const React = require("react");
  const { View } = require("react-native");
  return jest.fn((props) => <View {...props} testID="ScreenBackHeader" />);
});

// Mock hook
jest.mock("../../../hooks/useEditProfileForm");

describe("EditProfileScreen", () => {
  const mockForm = {
    fullName: "John Doe",
    previewUri: "https://example.com/avatar.jpg",
    onPickImage: jest.fn(),
    onRemoveImage: jest.fn(),
    email: "john.doe@example.com",
    setEmail: jest.fn(),
    setFullName: jest.fn(),
    confirmPassword: "confirmpassword",
    currentPassword: "currentpassword",
    newPassword: "newpassword",
    setConfirmPassword: jest.fn(),
    setCurrentPassword: jest.fn(),
    setNewPassword: jest.fn(),
    setShowPasswordFields: jest.fn(),
    showPasswordFields: true,
    saving: false,
    onSave: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useEditProfileForm.mockReturnValue(mockForm);
  });

  test("renders all elements and subcomponents with correct props", () => {
    const { getByTestId, getByText } = render(<EditProfileScreen />);

    // ScreenBackHeader check
    const header = getByTestId("ScreenBackHeader");
    expect(header).toBeTruthy();
    expect(header.props.title).toBe("Chỉnh sửa trang cá nhân");

    // Title and Subtitle text check
    expect(getByText("Chỉnh sửa trang cá nhân")).toBeTruthy();
    expect(getByText("Cập nhật thông tin của bạn")).toBeTruthy();

    // ProfileAvatarPicker check
    const avatarPicker = getByTestId("ProfileAvatarPicker");
    expect(avatarPicker).toBeTruthy();
    expect(avatarPicker.props.fullName).toBe("John Doe");
    expect(avatarPicker.props.previewUri).toBe("https://example.com/avatar.jpg");
    expect(avatarPicker.props.onPickImage).toBe(mockForm.onPickImage);
    expect(avatarPicker.props.onRemoveImage).toBe(mockForm.onRemoveImage);

    // ProfileInfoFields check
    const infoFields = getByTestId("ProfileInfoFields");
    expect(infoFields).toBeTruthy();
    expect(infoFields.props.email).toBe("john.doe@example.com");
    expect(infoFields.props.fullName).toBe("John Doe");
    expect(infoFields.props.setEmail).toBe(mockForm.setEmail);
    expect(infoFields.props.setFullName).toBe(mockForm.setFullName);

    // PasswordChangeFields check
    const passwordFields = getByTestId("PasswordChangeFields");
    expect(passwordFields).toBeTruthy();
    expect(passwordFields.props.confirmPassword).toBe("confirmpassword");
    expect(passwordFields.props.currentPassword).toBe("currentpassword");
    expect(passwordFields.props.newPassword).toBe("newpassword");
    expect(passwordFields.props.setConfirmPassword).toBe(mockForm.setConfirmPassword);
    expect(passwordFields.props.setCurrentPassword).toBe(mockForm.setCurrentPassword);
    expect(passwordFields.props.setNewPassword).toBe(mockForm.setNewPassword);
    expect(passwordFields.props.setShowPasswordFields).toBe(mockForm.setShowPasswordFields);
    expect(passwordFields.props.showPasswordFields).toBe(true);

    // Save button check
    const saveBtn = getByText("Lưu thay đổi");
    expect(saveBtn).toBeTruthy();
  });

  test("triggers info field state updates wrapping in act()", () => {
    const { getByTestId } = render(<EditProfileScreen />);
    const infoFields = getByTestId("ProfileInfoFields");

    act(() => {
      infoFields.props.setEmail("new.email@example.com");
    });
    expect(mockForm.setEmail).toHaveBeenCalledWith("new.email@example.com");

    act(() => {
      infoFields.props.setFullName("Jane Doe");
    });
    expect(mockForm.setFullName).toHaveBeenCalledWith("Jane Doe");
  });

  test("triggers password field updates wrapping in act()", () => {
    const { getByTestId } = render(<EditProfileScreen />);
    const passwordFields = getByTestId("PasswordChangeFields");

    act(() => {
      passwordFields.props.setCurrentPassword("new-curr");
    });
    expect(mockForm.setCurrentPassword).toHaveBeenCalledWith("new-curr");

    act(() => {
      passwordFields.props.setNewPassword("new-pass");
    });
    expect(mockForm.setNewPassword).toHaveBeenCalledWith("new-pass");

    act(() => {
      passwordFields.props.setConfirmPassword("new-pass");
    });
    expect(mockForm.setConfirmPassword).toHaveBeenCalledWith("new-pass");

    act(() => {
      passwordFields.props.setShowPasswordFields(false);
    });
    expect(mockForm.setShowPasswordFields).toHaveBeenCalledWith(false);
  });

  test("triggers pick/remove image callbacks wrapping in act()", () => {
    const { getByTestId } = render(<EditProfileScreen />);
    const avatarPicker = getByTestId("ProfileAvatarPicker");

    act(() => {
      avatarPicker.props.onPickImage();
    });
    expect(mockForm.onPickImage).toHaveBeenCalledTimes(1);

    act(() => {
      avatarPicker.props.onRemoveImage();
    });
    expect(mockForm.onRemoveImage).toHaveBeenCalledTimes(1);
  });

  test("pressing the save button calls form.onSave callback", () => {
    const { getByText } = render(<EditProfileScreen />);
    const saveBtn = getByText("Lưu thay đổi");

    act(() => {
      fireEvent.press(saveBtn);
    });

    expect(mockForm.onSave).toHaveBeenCalledTimes(1);
  });

  test("save button is disabled and displays saving text when form.saving is true", () => {
    useEditProfileForm.mockReturnValueOnce({
      ...mockForm,
      saving: true,
    });

    const { getByText, UNSAFE_getByType } = render(<EditProfileScreen />);

    // Check saving text renders
    expect(getByText("Đang lưu...")).toBeTruthy();

    // Check save button is disabled
    const saveBtn = UNSAFE_getByType(Pressable);
    expect(saveBtn.props.disabled).toBe(true);

    // Press save button and assert that onSave is not called
    act(() => {
      if (!saveBtn.props.disabled && saveBtn.props.onPress) {
        saveBtn.props.onPress();
      }
    });
    expect(mockForm.onSave).not.toHaveBeenCalled();
  });
});

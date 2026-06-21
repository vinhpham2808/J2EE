import React from "react";
import { create, act } from "react-test-renderer";
import { TextInput, Pressable, Text } from "react-native";
import PasswordChangeFields from "../PasswordChangeFields";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    TEXT: "#000",
    BG: "#FFF",
    CARD_BORDER: "#E0E0E0",
    PRIMARY: "#EF5E83",
  },
  useAppColors: () => ({
    TEXT: "#000",
    TEXT_MUTED: "#999",
    BG: "#FFF",
    CARD_BORDER: "#E0E0E0",
    PRIMARY: "#EF5E83",
    PRIMARY_GLOW: "rgba(239,94,131,0.1)",
    PRIMARY_GLOW_STRONG: false,
  }),
}));

const baseProps = {
  confirmPassword: "",
  currentPassword: "",
  newPassword: "",
  setConfirmPassword: jest.fn(),
  setCurrentPassword: jest.fn(),
  setNewPassword: jest.fn(),
  setShowPasswordFields: jest.fn(),
  showPasswordFields: false,
};

describe("PasswordChangeFields", () => {
  beforeEach(() => jest.clearAllMocks());

  // ---- Collapsed state ----
  it("renders a single button when showPasswordFields=false", () => {
    let root;
    act(() => {
      root = create(<PasswordChangeFields {...baseProps} />);
    });
    const pressables = root.root.findAllByType(Pressable);
    expect(pressables.length).toBe(1);
  });

  it("shows button title text when collapsed", () => {
    let root;
    act(() => {
      root = create(<PasswordChangeFields {...baseProps} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain("passwordFields.buttonTitle");
  });

  it("does NOT render any TextInput when collapsed", () => {
    let root;
    act(() => {
      root = create(<PasswordChangeFields {...baseProps} />);
    });
    const inputs = root.root.findAllByType(TextInput);
    expect(inputs.length).toBe(0);
  });

  it("calls setShowPasswordFields(true) when button pressed", () => {
    const setShowPasswordFields = jest.fn();
    let root;
    act(() => {
      root = create(
        <PasswordChangeFields
          {...baseProps}
          setShowPasswordFields={setShowPasswordFields}
        />
      );
    });
    act(() => {
      root.root.findByType(Pressable).props.onPress();
    });
    expect(setShowPasswordFields).toHaveBeenCalledWith(true);
  });

  // ---- Expanded state ----
  it("renders 3 TextInputs when showPasswordFields=true", () => {
    let root;
    act(() => {
      root = create(
        <PasswordChangeFields {...baseProps} showPasswordFields={true} />
      );
    });
    const inputs = root.root.findAllByType(TextInput);
    expect(inputs.length).toBe(3);
  });

  it("all three inputs have secureTextEntry enabled", () => {
    let root;
    act(() => {
      root = create(
        <PasswordChangeFields {...baseProps} showPasswordFields={true} />
      );
    });
    const inputs = root.root.findAllByType(TextInput);
    inputs.forEach((input) => {
      expect(input.props.secureTextEntry).toBe(true);
    });
  });

  it("renders labels for currentPassword, newPassword, confirmPassword", () => {
    let root;
    act(() => {
      root = create(
        <PasswordChangeFields {...baseProps} showPasswordFields={true} />
      );
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain("passwordFields.currentPassword");
    expect(texts).toContain("auth.password.newPassword");
    expect(texts).toContain("passwordFields.confirmPassword");
  });

  it("currentPassword input has correct value and calls setCurrentPassword", () => {
    const setCurrentPassword = jest.fn();
    let root;
    act(() => {
      root = create(
        <PasswordChangeFields
          {...baseProps}
          showPasswordFields={true}
          currentPassword="oldPass"
          setCurrentPassword={setCurrentPassword}
        />
      );
    });
    const inputs = root.root.findAllByType(TextInput);
    expect(inputs[0].props.value).toBe("oldPass");
    act(() => {
      inputs[0].props.onChangeText("newValue");
    });
    expect(setCurrentPassword).toHaveBeenCalledWith("newValue");
  });

  it("newPassword input has correct value and calls setNewPassword", () => {
    const setNewPassword = jest.fn();
    let root;
    act(() => {
      root = create(
        <PasswordChangeFields
          {...baseProps}
          showPasswordFields={true}
          newPassword="newPass"
          setNewPassword={setNewPassword}
        />
      );
    });
    const inputs = root.root.findAllByType(TextInput);
    expect(inputs[1].props.value).toBe("newPass");
    act(() => {
      inputs[1].props.onChangeText("changed");
    });
    expect(setNewPassword).toHaveBeenCalledWith("changed");
  });

  it("confirmPassword input has correct value and calls setConfirmPassword", () => {
    const setConfirmPassword = jest.fn();
    let root;
    act(() => {
      root = create(
        <PasswordChangeFields
          {...baseProps}
          showPasswordFields={true}
          confirmPassword="confirmPass"
          setConfirmPassword={setConfirmPassword}
        />
      );
    });
    const inputs = root.root.findAllByType(TextInput);
    expect(inputs[2].props.value).toBe("confirmPass");
    act(() => {
      inputs[2].props.onChangeText("confirmed");
    });
    expect(setConfirmPassword).toHaveBeenCalledWith("confirmed");
  });

  it("renders correct placeholder keys on all inputs", () => {
    let root;
    act(() => {
      root = create(
        <PasswordChangeFields {...baseProps} showPasswordFields={true} />
      );
    });
    const inputs = root.root.findAllByType(TextInput);
    expect(inputs[0].props.placeholder).toBe("passwordFields.currentPasswordPlaceholder");
    expect(inputs[1].props.placeholder).toBe("passwordFields.newPasswordPlaceholder");
    expect(inputs[2].props.placeholder).toBe("passwordFields.confirmPasswordPlaceholder");
  });
});

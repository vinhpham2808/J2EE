import React from "react";
import { create, act } from "react-test-renderer";
import { TextInput, Text } from "react-native";
import ProfileInfoFields from "../ProfileInfoFields";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    TEXT: "#000",
    BG: "#FFF",
    CARD_BORDER: "#E0E0E0",
  },
  useAppColors: () => ({
    TEXT: "#000",
    TEXT_MUTED: "#999",
    BG: "#FFF",
    CARD_BORDER: "#E0E0E0",
  }),
}));

const baseProps = {
  email: "test@example.com",
  fullName: "Nguyen Van A",
  setEmail: jest.fn(),
  setFullName: jest.fn(),
};

describe("ProfileInfoFields", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders 2 TextInputs", () => {
    let root;
    act(() => {
      root = create(<ProfileInfoFields {...baseProps} />);
    });
    expect(root.root.findAllByType(TextInput).length).toBe(2);
  });

  it("renders fullName and email labels", () => {
    let root;
    act(() => {
      root = create(<ProfileInfoFields {...baseProps} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain("profileInfo.fullName");
    expect(texts).toContain("profileInfo.email");
  });

  it("fullName input displays the correct value", () => {
    let root;
    act(() => {
      root = create(<ProfileInfoFields {...baseProps} fullName="Test User" />);
    });
    const inputs = root.root.findAllByType(TextInput);
    expect(inputs[0].props.value).toBe("Test User");
  });

  it("email input displays the correct value", () => {
    let root;
    act(() => {
      root = create(<ProfileInfoFields {...baseProps} email="hello@mail.com" />);
    });
    const inputs = root.root.findAllByType(TextInput);
    expect(inputs[1].props.value).toBe("hello@mail.com");
  });

  it("calls setFullName when fullName input changes", () => {
    const setFullName = jest.fn();
    let root;
    act(() => {
      root = create(<ProfileInfoFields {...baseProps} setFullName={setFullName} />);
    });
    act(() => {
      root.root.findAllByType(TextInput)[0].props.onChangeText("New Name");
    });
    expect(setFullName).toHaveBeenCalledWith("New Name");
  });

  it("calls setEmail when email input changes", () => {
    const setEmail = jest.fn();
    let root;
    act(() => {
      root = create(<ProfileInfoFields {...baseProps} setEmail={setEmail} />);
    });
    act(() => {
      root.root.findAllByType(TextInput)[1].props.onChangeText("new@mail.com");
    });
    expect(setEmail).toHaveBeenCalledWith("new@mail.com");
  });

  it("email input uses email-address keyboardType", () => {
    let root;
    act(() => {
      root = create(<ProfileInfoFields {...baseProps} />);
    });
    const emailInput = root.root.findAllByType(TextInput)[1];
    expect(emailInput.props.keyboardType).toBe("email-address");
  });

  it("email input has autoCapitalize=none", () => {
    let root;
    act(() => {
      root = create(<ProfileInfoFields {...baseProps} />);
    });
    const emailInput = root.root.findAllByType(TextInput)[1];
    expect(emailInput.props.autoCapitalize).toBe("none");
  });

  it("renders correct placeholder keys", () => {
    let root;
    act(() => {
      root = create(<ProfileInfoFields {...baseProps} />);
    });
    const inputs = root.root.findAllByType(TextInput);
    expect(inputs[0].props.placeholder).toBe("profileInfo.fullNamePlaceholder");
    expect(inputs[1].props.placeholder).toBe("profileInfo.emailPlaceholder");
  });
});

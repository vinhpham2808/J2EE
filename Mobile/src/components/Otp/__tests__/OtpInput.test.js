import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TextInput } from "react-native";
import OtpInput from "../OtpInput";

jest.mock("../../../constants/colors", () => ({
  COLORS: {
    DARK_INPUT_BG: "#1A1625",
    DARK_BORDER: "#2D2640",
    DARK_TEXT: "#FFFFFF",
    PRIMARY: "#EF5E83",
    DARK_BG: "#120E1C",
  },
}));

describe("OtpInput", () => {
  const mockOnChange = jest.fn();
  const mockOnKeyDown = jest.fn();
  const inputRefs = { current: [] };

  beforeEach(() => {
    jest.clearAllMocks();
    inputRefs.current = [];
  });

  test("renders correct number of TextInput inputs based on otp array length", () => {
    const otp = ["", "", "", ""];
    const { UNSAFE_getAllByType } = render(
      <OtpInput otp={otp} inputRefs={inputRefs} onChange={mockOnChange} onKeyDown={mockOnKeyDown} />
    );

    const inputs = UNSAFE_getAllByType(TextInput);
    expect(inputs.length).toBe(4);
  });

  test("calls onChange when typing text in an input", () => {
    const otp = ["1", "", "", ""];
    const { UNSAFE_getAllByType } = render(
      <OtpInput otp={otp} inputRefs={inputRefs} onChange={mockOnChange} onKeyDown={mockOnKeyDown} />
    );

    const inputs = UNSAFE_getAllByType(TextInput);
    
    // Type "2" into the second input (index 1)
    fireEvent.changeText(inputs[1], "2");
    expect(mockOnChange).toHaveBeenCalledWith(1, "2");
  });

  test("calls onKeyDown when pressing a key", () => {
    const otp = ["1", "2", "", ""];
    const { UNSAFE_getAllByType } = render(
      <OtpInput otp={otp} inputRefs={inputRefs} onChange={mockOnChange} onKeyDown={mockOnKeyDown} />
    );

    const inputs = UNSAFE_getAllByType(TextInput);
    
    // Press backspace on index 1
    fireEvent(inputs[1], "keyPress", { nativeEvent: { key: "Backspace" } });
    expect(mockOnKeyDown).toHaveBeenCalledWith(1, "Backspace");
  });

  test("applies focused style when text input receives focus and clears on blur", () => {
    const otp = ["", "", "", ""];
    const { UNSAFE_getAllByType } = render(
      <OtpInput otp={otp} inputRefs={inputRefs} onChange={mockOnChange} onKeyDown={mockOnKeyDown} />
    );

    const inputs = UNSAFE_getAllByType(TextInput);
    const targetInput = inputs[1];

    // Trigger focus
    fireEvent(targetInput, "focus");
    // Verify border width of focused index style is 2 (styles.otpInputFocused has borderWidth: 2)
    expect(targetInput.props.style).toContainEqual(expect.objectContaining({ borderWidth: 2 }));

    // Trigger blur
    fireEvent(targetInput, "blur");
    expect(targetInput.props.style).not.toContainEqual(expect.objectContaining({ borderWidth: 2 }));
  });

  test("references each input element inside inputRefs", () => {
    const otp = ["", "", ""];
    render(
      <OtpInput otp={otp} inputRefs={inputRefs} onChange={mockOnChange} onKeyDown={mockOnKeyDown} />
    );

    expect(inputRefs.current.length).toBe(3);
    expect(inputRefs.current[0]).not.toBeNull();
    expect(inputRefs.current[1]).not.toBeNull();
  });
});

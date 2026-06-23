import { renderHook, act } from "@testing-library/react-native";
import useOtpInput from "../useOtpInput";

describe("useOtpInput", () => {
  test("initial state has empty array of 6 and code is empty string", () => {
    const { result } = renderHook(() => useOtpInput());
    expect(result.current.otp).toEqual(["", "", "", "", "", ""]);
    expect(result.current.code).toBe("");
  });

  test("handleChange updates the correct index", () => {
    const { result } = renderHook(() => useOtpInput());
    act(() => { result.current.handleChange(0, "5"); });
    expect(result.current.otp[0]).toBe("5");
    expect(result.current.code).toBe("5");
  });

  test("handleChange ignores non-digit input", () => {
    const { result } = renderHook(() => useOtpInput());
    act(() => { result.current.handleChange(0, "a"); });
    expect(result.current.code).toBe("");
  });

  test("handleChange takes last character when pasting multiple chars", () => {
    const { result } = renderHook(() => useOtpInput());
    act(() => { result.current.handleChange(0, "789"); });
    expect(result.current.otp[0]).toBe("9");
  });

  test("handleKeyDown on Backspace at empty field focuses prev", () => {
    const { result } = renderHook(() => useOtpInput());
    const input0 = { focus: jest.fn() };
    result.current.inputRefs.current = [input0, null, null, null, null, null];

    act(() => { result.current.handleKeyDown(1, "Backspace"); });
    expect(input0.focus).toHaveBeenCalled();
  });

  test("handleKeyDown does not backspace at index 0", () => {
    const { result } = renderHook(() => useOtpInput());
    const input0 = { focus: jest.fn() };
    result.current.inputRefs.current = [input0, null, null, null, null, null];

    act(() => { result.current.handleKeyDown(0, "Backspace"); });
    expect(input0.focus).not.toHaveBeenCalled();
  });

  test("reset clears all fields", () => {
    const { result } = renderHook(() => useOtpInput());
    act(() => {
      result.current.handleChange(0, "1");
      result.current.handleChange(1, "2");
    });
    expect(result.current.code).toBe("12");

    act(() => { result.current.reset(); });
    expect(result.current.otp).toEqual(["", "", "", "", "", ""]);
    expect(result.current.code).toBe("");
  });

  test("setOtpAndRef updates both state and ref", () => {
    const { result } = renderHook(() => useOtpInput());
    const next = ["1", "2", "3", "4", "5", "6"];
    act(() => {
      result.current.handleChange(0, "1");
      result.current.handleChange(1, "2");
      result.current.handleChange(2, "3");
      result.current.handleChange(3, "4");
      result.current.handleChange(4, "5");
      result.current.handleChange(5, "6");
    });
    expect(result.current.code).toBe("123456");
  });

  test("OTP_LENGTH is 6", () => {
    const { result } = renderHook(() => useOtpInput());
    expect(result.current.otp).toHaveLength(6);
  });
});

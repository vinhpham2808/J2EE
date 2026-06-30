import { renderHook, act } from "@testing-library/react-native";
import useOtpCountdown from "../useOtpCountdown";

describe("useOtpCountdown", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("starts with resendDisabled false and countdown 0", () => {
    const { result } = renderHook(() => useOtpCountdown());
    expect(result.current.resendDisabled).toBe(false);
    expect(result.current.countdown).toBe(0);
  });

  test("initialCountdown > 0 sets countdown value", () => {
    const { result } = renderHook(() => useOtpCountdown(30));
    expect(result.current.countdown).toBe(30);
  });

  test("initialCountdown gets ceiling", () => {
    const { result } = renderHook(() => useOtpCountdown(30.5));
    expect(result.current.countdown).toBe(31);
  });

  test("initialCountdown 0 does not start countdown", () => {
    const { result } = renderHook(() => useOtpCountdown(0));
    expect(result.current.resendDisabled).toBe(false);
    expect(result.current.countdown).toBe(0);
  });

  test("decrements countdown every second via startCountdown", () => {
    const { result } = renderHook(() => useOtpCountdown());
    act(() => { result.current.startCountdown(3); });

    expect(result.current.countdown).toBe(3);
    act(() => { jest.advanceTimersByTime(1000); });
    expect(result.current.countdown).toBe(2);
    act(() => { jest.advanceTimersByTime(1000); });
    expect(result.current.countdown).toBe(1);
    act(() => { jest.advanceTimersByTime(1000); });
    expect(result.current.countdown).toBe(0);
    expect(result.current.resendDisabled).toBe(false);
  });

  test("startCountdown sets countdown and resendDisabled", () => {
    const { result } = renderHook(() => useOtpCountdown());
    act(() => { result.current.startCountdown(60); });
    expect(result.current.resendDisabled).toBe(true);
    expect(result.current.countdown).toBe(60);
  });

  test("startCountdown uses default 60 seconds", () => {
    const { result } = renderHook(() => useOtpCountdown());
    act(() => { result.current.startCountdown(); });
    expect(result.current.countdown).toBe(60);
  });

  test("stopCountdown resets countdown and enables resend", () => {
    const { result } = renderHook(() => useOtpCountdown());
    act(() => { result.current.startCountdown(30); });
    act(() => { result.current.stopCountdown(); });
    expect(result.current.resendDisabled).toBe(false);
    expect(result.current.countdown).toBe(0);
  });

  test("countdown does not go below 0", () => {
    const { result } = renderHook(() => useOtpCountdown());
    act(() => { result.current.startCountdown(1); });
    act(() => { jest.advanceTimersByTime(5000); });
    expect(result.current.countdown).toBe(0);
    expect(result.current.resendDisabled).toBe(false);
  });
});

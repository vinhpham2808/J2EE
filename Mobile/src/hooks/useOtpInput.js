import { useState, useRef, useCallback } from "react";

const OTP_LENGTH = 6;

export default function useOtpInput() {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const otpRef = useRef(otp);
  const inputRefs = useRef([]);

  const setOtpAndRef = useCallback((next) => {
    otpRef.current = next;
    setOtp(next);
  }, []);

  const handleChange = useCallback((index, value) => {
    if (value.length > 1) {
      value = value.charAt(value.length - 1);
    }
    if (!/^\d*$/.test(value)) return;

    const next = [...otpRef.current];
    next[index] = value;
    setOtpAndRef(next);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [setOtpAndRef]);

  const handleKeyDown = useCallback((index, key) => {
    if (key === "Backspace" && !otpRef.current[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, []);

  const reset = useCallback(() => {
    const empty = Array(OTP_LENGTH).fill("");
    setOtpAndRef(empty);
    inputRefs.current[0]?.focus();
  }, [setOtpAndRef]);

  const code = otp.join("");

  return {
    otp,
    code,
    inputRefs,
    handleChange,
    handleKeyDown,
    reset,
  };
}

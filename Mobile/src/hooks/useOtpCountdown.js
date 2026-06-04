import { useState, useEffect, useCallback } from "react";

export default function useOtpCountdown(initialCountdown = 0) {
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (initialCountdown > 0) {
      setResendDisabled(true);
      setCountdown(Math.ceil(initialCountdown));
    }
  }, [initialCountdown]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    setResendDisabled(false);
  }, [countdown]);

  const startCountdown = useCallback((seconds = 60) => {
    setResendDisabled(true);
    setCountdown(seconds);
  }, []);

  const stopCountdown = useCallback(() => {
    setResendDisabled(false);
    setCountdown(0);
  }, []);

  return {
    resendDisabled,
    countdown,
    startCountdown,
    stopCountdown,
  };
}

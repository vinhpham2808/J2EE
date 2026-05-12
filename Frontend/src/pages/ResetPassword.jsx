import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * This page is no longer used. The token-based reset flow has been
 * replaced with OTP-based reset handled entirely in ForgotPassword.jsx.
 * Redirect immediately to /forgot-password.
 */
const ResetPassword = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/forgot-password", { replace: true });
  }, [navigate]);

  return null;
};

export default ResetPassword;

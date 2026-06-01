import { useEffect, useState } from "react";
import { LoaderCircle, ArrowLeft, Mail, CheckCircle, Eye, EyeOff, RefreshCw, KeyRound, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import Input from "../components/Input.jsx";
import axiosConfig from "../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import { validateEmail } from "../util/validation.js";
import { usePageTitle } from "../hooks/usePageTitle.js";

const STEPS = { EMAIL: "email", OTP: "otp", NEW_PASSWORD: "new_password", SUCCESS: "success" };

const ForgotPassword = () => {
  const navigate = useNavigate();
  usePageTitle("Quên mật khẩu");

  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false, uppercase: false, lowercase: false, number: false,
  });

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const checkPasswordStrength = (pw) => {
    setPasswordStrength({
      length: pw.length >= 8,
      uppercase: /[A-Z]/.test(pw),
      lowercase: /[a-z]/.test(pw),
      number: /[0-9]/.test(pw),
    });
  };

  // Step 1: Send OTP to email
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateEmail(email)) { setError("Vui lòng nhập địa chỉ email hợp lệ."); return; }
    setIsLoading(true);
    try {
      await axiosConfig.post(API_ENDPOINTS.FORGOT_PASSWORD, { email });
      setStep(STEPS.OTP);
    } catch (err) {
      const retryAfter = err.response?.data?.retryAfterSeconds;
      if (retryAfter) {
        setStep(STEPS.OTP);
        setCountdown(Number(retryAfter));
      } else {
        setError(err.response?.data?.message || "Không thể gửi yêu cầu. Vui lòng thử lại sau.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP only (no password change yet)
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.trim().length !== 6) { setError("Mã OTP phải có đúng 6 chữ số."); return; }
    setIsLoading(true);
    try {
      await axiosConfig.post(API_ENDPOINTS.VERIFY_RESET_OTP, { email, otp: otp.trim() });
      setStep(STEPS.NEW_PASSWORD);
    } catch (err) {
      setError(err.response?.data?.message || "Mã OTP không hợp lệ. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Set new password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) { setError("Mật khẩu mới phải có ít nhất 8 ký tự."); return; }
    if (newPassword !== confirmPassword) { setError("Mật khẩu xác nhận không khớp."); return; }
    setIsLoading(true);
    try {
      await axiosConfig.post(API_ENDPOINTS.RESET_PASSWORD, {
        email,
        otp: otp.trim(),
        newPassword,
      });
      setStep(STEPS.SUCCESS);
    } catch (err) {
      // OTP may have expired between steps — send back to OTP step
      setError(err.response?.data?.message || "Đặt lại mật khẩu thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setError("");
    setIsResending(true);
    try {
      await axiosConfig.post(API_ENDPOINTS.OTP_RESEND, { email });
      setOtp("");
      setCountdown(180);
    } catch (err) {
      const retryAfter = err.response?.data?.retryAfterSeconds;
      if (retryAfter) {
        setCountdown(Number(retryAfter));
      } else {
        setError(err.response?.data?.message || "Không thể gửi lại OTP. Vui lòng thử lại.");
      }
    } finally {
      setIsResending(false);
    }
  };

  const cardClass = "w-full rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl bg-white dark:bg-[#0F172A]";

  // ─── Success ──────────────────────────────────────────────────────
  if (step === STEPS.SUCCESS) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0A0E1A] flex flex-col">
        <Header />
        <main className="mx-auto flex max-w-md items-center justify-center px-6 py-16 flex-1">
          <div className={`${cardClass} p-10 text-center`}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10">
              <CheckCircle size={32} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Thành công!</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-7">
              Mật khẩu đã được thay đổi. Bạn có thể đăng nhập với mật khẩu mới.
            </p>
            <button onClick={() => navigate("/login")} className="btn-primary w-full">
              Đăng nhập ngay
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0E1A] flex flex-col">
      <Header />
      <main className="mx-auto flex max-w-md items-center justify-center px-6 py-16 flex-1">
        <div className={cardClass}>
          <div className="p-8">

            {/* Back button */}
            <button
              onClick={() => {
                setError("");
                if (step === STEPS.OTP) { setStep(STEPS.EMAIL); setOtp(""); }
                else if (step === STEPS.NEW_PASSWORD) { setStep(STEPS.OTP); }
                else navigate("/login");
              }}
              className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors mb-6"
            >
              <ArrowLeft size={16} />
              {step === STEPS.EMAIL ? "Quay lại đăng nhập" : "Quay lại"}
            </button>

            {/* Step indicator */}
            {step !== STEPS.EMAIL && (
              <div className="flex items-center gap-2 mb-6">
                {[
                  { key: STEPS.OTP, label: "Xác thực OTP" },
                  { key: STEPS.NEW_PASSWORD, label: "Mật khẩu mới" },
                ].map(({ key, label }, idx) => {
                  const isActive = step === key;
                  const isDone = step === STEPS.NEW_PASSWORD && key === STEPS.OTP;
                  return (
                    <div key={key} className="flex items-center gap-2 flex-1">
                      {idx > 0 && <div className={`h-px flex-1 ${isDone ? "bg-amber-500" : "bg-slate-200 dark:bg-white/10"}`} />}
                      <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors
                        ${isDone ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                          : isActive ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400"
                          : "border-slate-200 dark:border-white/10 text-slate-400"}`}>
                        {isDone ? <ShieldCheck size={11} /> : <span>{idx + 1}</span>}
                        {label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── Step 1: Enter email ──────────────────────────── */}
            {step === STEPS.EMAIL && (
              <>
                <div className="text-center mb-8">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <Mail size={24} className="text-amber-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quên mật khẩu?</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Nhập email để nhận mã OTP đặt lại mật khẩu
                  </p>
                </div>
                <form className="space-y-5" onSubmit={handleEmailSubmit}>
                  <Input
                    label="Địa chỉ email"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tenban@example.com"
                    type="email"
                    value={email}
                    autoFocus
                  />
                  {error && <p className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</p>}
                  <button className="btn-primary flex w-full items-center justify-center gap-2" disabled={isLoading} type="submit">
                    {isLoading ? <><LoaderCircle className="animate-spin" size={18} />Đang gửi...</> : "Gửi mã OTP"}
                  </button>
                  <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                    Chưa có tài khoản?{" "}
                    <Link className="font-semibold text-amber-600 dark:text-amber-400 hover:underline" to="/signup">Đăng ký ngay</Link>
                  </p>
                </form>
              </>
            )}

            {/* ─── Step 2: Verify OTP ───────────────────────────── */}
            {step === STEPS.OTP && (
              <>
                <div className="text-center mb-8">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20">
                    <KeyRound size={24} className="text-violet-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Nhập mã OTP</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Mã đã được gửi tới <strong className="text-slate-700 dark:text-slate-300">{email}</strong>
                  </p>
                </div>
                <form className="space-y-4" onSubmit={handleOtpSubmit}>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Mã OTP (6 chữ số)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••••"
                      className="w-full rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] outline-none font-mono transition-all duration-300
                        bg-slate-100/50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/8
                        border border-slate-200 dark:border-white/10
                        text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600
                        focus:bg-white dark:focus:bg-slate-900/60 focus:border-violet-500 dark:focus:border-amber-500
                        focus:ring-1 focus:ring-violet-500/20 dark:focus:ring-amber-500/20
                        focus:shadow-[0_0_15px_rgba(139,92,246,0.1)] dark:focus:shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                      autoFocus
                    />
                  </div>
                  {error && <p className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</p>}
                  <button className="btn-primary flex w-full items-center justify-center gap-2" disabled={isLoading} type="submit">
                    {isLoading ? <><LoaderCircle className="animate-spin" size={18} />Đang xác thực...</> : "Xác nhận mã OTP"}
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={countdown > 0 || isResending}
                    className="btn-secondary w-full flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResending
                      ? <><LoaderCircle className="animate-spin" size={15} />Đang gửi...</>
                      : countdown > 0
                        ? <><RefreshCw size={15} />Gửi lại sau {countdown}s</>
                        : <><RefreshCw size={15} />Gửi lại mã OTP</>
                    }
                  </button>
                </form>
              </>
            )}

            {/* ─── Step 3: New Password ─────────────────────────── */}
            {step === STEPS.NEW_PASSWORD && (
              <>
                <div className="text-center mb-8">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <ShieldCheck size={24} className="text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Tạo mật khẩu mới</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    OTP đã xác thực. Nhập mật khẩu mới cho tài khoản của bạn.
                  </p>
                </div>
                <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Mật khẩu mới</label>
                    <div className="relative">
                      <Input
                        onChange={(e) => { setNewPassword(e.target.value); checkPasswordStrength(e.target.value); }}
                        placeholder="Ít nhất 8 ký tự"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-[calc(50%+2px)] -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {newPassword && (
                    <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3 space-y-1">
                      {[
                        [passwordStrength.length, "Ít nhất 8 ký tự"],
                        [passwordStrength.uppercase, "1 chữ hoa"],
                        [passwordStrength.lowercase, "1 chữ thường"],
                        [passwordStrength.number, "1 chữ số"],
                      ].map(([ok, label]) => (
                        <p key={label} className={`text-xs ${ok ? "text-emerald-500" : "text-slate-400 dark:text-slate-500"}`}>
                          {ok ? "✓" : "○"} {label}
                        </p>
                      ))}
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Xác nhận mật khẩu</label>
                    <div className="relative">
                      <Input
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-[calc(50%+2px)] -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {error && <p className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</p>}

                  <button className="btn-primary flex w-full items-center justify-center gap-2" disabled={isLoading} type="submit">
                    {isLoading ? <><LoaderCircle className="animate-spin" size={18} />Đang đặt lại...</> : "Đặt lại mật khẩu"}
                  </button>
                </form>
              </>
            )}

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ForgotPassword;

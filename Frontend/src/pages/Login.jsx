import { useCallback, useContext, useEffect, useState, useRef } from "react";
import { LoaderCircle, Zap } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AppContext } from "../context/AppContext.jsx";
import Header from "../components/Header.jsx";
import Input from "../components/Input.jsx";
import axiosConfig from "../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import { validateEmail } from "../util/validation.js";
import { usePageTitle } from "../hooks/usePageTitle.js";
import Footer from "../components/Footer.jsx";
import favicon from "../assets/logo/favicon.png";
import toast from "react-hot-toast";
import { getPostAuthRedirectPath } from "../util/defaultAuthenticatedRoute.js";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Login = () => {
  const navigate = useNavigate();
  usePageTitle("Đăng nhập");
  const { setUser } = useContext(AppContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const googleBtnContainerRef = useRef(null);
  const googleBtnLightRef = useRef(null);
  const googleBtnDarkRef = useRef(null);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (searchParams.get("expired") === "true") {
      toast.error("Phiên đăng nhập đã hết hạn hoặc bạn đã đăng xuất ở một tab khác. Vui lòng đăng nhập lại.", {
        id: "session-expired-toast"
      });
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("expired");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleGoogleCredential = useCallback(async (response) => {
    setError("");
    try {
      const { data } = await axiosConfig.post(API_ENDPOINTS.GOOGLE_AUTH, {
        idToken: response.credential,
      });
      const { user } = data;
      if (user) {
        setUser(user);
        navigate(getPostAuthRedirectPath(user));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập bằng Google thất bại. Vui lòng thử lại.");
    }
  }, [navigate, setUser]);

  // Load Google Identity Services script và khởi tạo
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initializeGoogle = () => {
      if (window.google?.accounts?.id && googleBtnLightRef.current && googleBtnDarkRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
          ux_mode: "popup",
          use_fedcm_for_prompt: true,
        });

        renderGoogleButtons();
      }
    };

    const renderGoogleButtons = () => {
      if (!googleBtnLightRef.current || !googleBtnDarkRef.current || !googleBtnContainerRef.current) return;
      
      const containerWidth = googleBtnContainerRef.current.offsetWidth || 400;

      window.google.accounts.id.renderButton(googleBtnLightRef.current, {
        theme: "outline",
        size: "large",
        width: containerWidth,
        shape: "rectangular",
        logo_alignment: "center",
      });

      window.google.accounts.id.renderButton(googleBtnDarkRef.current, {
        theme: "filled_black",
        size: "large",
        width: containerWidth,
        shape: "rectangular",
        logo_alignment: "center",
      });
    };

    // Theo dõi load API
    if (window.google?.accounts?.id) {
      // Đợi 1 chút để DOM form kịp render Width 100%
      setTimeout(initializeGoogle, 100);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.head.appendChild(script);

    return () => {
      // Cleanup: cancel one-tap nếu có
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, [handleGoogleCredential]);

  const handleForgotPassword = () => navigate("/forgot-password");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    if (!validateEmail(email)) {
      setError("Vui lòng nhập địa chỉ email hợp lệ");
      setIsLoading(false);
      return;
    }
    if (!password.trim()) {
      setError("Vui lòng nhập mật khẩu");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axiosConfig.post(API_ENDPOINTS.LOGIN, { email, password });
      const { user } = response.data;
      if (user) {
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email.trim());
        } else {
          localStorage.removeItem("rememberedEmail");
        }
        setUser(user);
        navigate(getPostAuthRedirectPath(user));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0E1A] flex flex-col">
      <Header />
      <main className="mx-auto flex max-w-5xl items-center justify-center px-6 py-12 flex-1">
        <div className="grid w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 md:grid-cols-[0.95fr_1.05fr] shadow-2xl">

          {/* Left visual panel */}
          <section className="hidden md:flex flex-col justify-between p-10 bg-linear-to-br from-[#0F172A] to-[#1E293B] relative overflow-hidden">
            <div className="absolute inset-0 opacity-30"
              style={{ backgroundImage: "radial-gradient(circle at 30% 70%, #F59E0B33 0%, transparent 60%), radial-gradient(circle at 80% 20%, #8B5CF633 0%, transparent 50%)" }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-10">
                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                  <img src={favicon} alt="Money Manager Logo" className="w-12 h-12 max-w-none object-cover scale-110" />
                </div>
                <span className="text-white font-bold text-lg">Money<span className="text-amber-400">Manager</span></span>
              </div>
              <h2 className="text-3xl font-bold text-white leading-snug mb-4">
                Quản lý tài chính<br />
                <span className="text-amber-400">thông minh hơn</span>
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Theo dõi thu chi, lập kế hoạch ngân sách và đạt mục tiêu tài chính của bạn với AI hỗ trợ.
              </p>
            </div>

            <div className="relative grid grid-cols-2 gap-3 mt-8">
              {[
                { label: "Người dùng", value: "150K+" },
                { label: "Giao dịch", value: "$2.4B" },
                { label: "Đánh giá", value: "4.9/5" },
                { label: "Uptime", value: "99.9%" },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-amber-400 font-bold text-lg">{s.value}</p>
                  <p className="text-slate-400 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Right form */}
          <section className="bg-white dark:bg-[#0F172A] p-8 md:p-10">
            <div className="space-y-1.5 mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Chào mừng quay lại</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Nhập thông tin tài khoản để tiếp tục.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <Input
                label="Địa chỉ email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tenban@example.com"
                type="text"
                value={email}
              />
              <Input
                label="Mật khẩu"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                value={password}
              />

              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    checked={rememberMe}
                    className="h-4 w-4 rounded border-slate-300 accent-violet-600"
                    onChange={(e) => setRememberMe(e.target.checked)}
                    type="checkbox"
                  />
                  Ghi nhớ đăng nhập
                </label>
                <button
                  className="font-medium text-amber-600 dark:text-amber-400 hover:underline"
                  onClick={handleForgotPassword}
                  type="button"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  {error}
                </p>
              )}

              <button className="btn-primary flex items-center justify-center gap-2" disabled={isLoading} type="submit">
                {isLoading ? (
                  <>
                    <LoaderCircle className="animate-spin" size={18} />
                    Đang đăng nhập...
                  </>
                ) : "ĐĂNG NHẬP"}
              </button>

              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                <span className="text-xs uppercase tracking-wide text-slate-400">hoặc</span>
                <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
              </div>

              {/* Render sẵn 2 nút Google nhưng dùng CSS để ẩn/hiện mượt mà khi đổi theme */}
              <div className="w-full" ref={googleBtnContainerRef}>
                <div 
                  className="google-btn-wrapper flex justify-center dark:hidden" 
                  ref={googleBtnLightRef}
                ></div>
                <div 
                  className="google-btn-wrapper hidden dark:flex justify-center" 
                  ref={googleBtnDarkRef}
                ></div>
              </div>

              <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                Chưa có tài khoản?{" "}
                <Link className="font-semibold text-amber-600 dark:text-amber-400 hover:underline" to="/signup">
                  Đăng ký ngay
                </Link>
              </p>
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;

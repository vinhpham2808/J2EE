import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/Input.jsx";
import { validateEmail } from "../util/validation.js";
import axiosConfig from "../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import toast from "react-hot-toast";
import { LoaderCircle, Zap } from "lucide-react";
import ProfilePhotoSelector from "../components/ProfilePhotoSelector.jsx";
import uploadProfileImage from "../util/uploadProfileImage.js";
import Header from "../components/Header.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";
import Footer from "../components/Footer.jsx";
import favicon from "../assets/logo/favicon.png";

const Signup = () => {
  usePageTitle("Đăng ký tài khoản");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    let profileImageUrl = "";
    setIsLoading(true);

    if (!fullName.trim()) {
      setError("Vui lòng nhập họ và tên");
      setIsLoading(false);
      return;
    }
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
    setError("");

    try {
      if (profilePhoto) {
        const imageUrl = await uploadProfileImage(profilePhoto);
        profileImageUrl = imageUrl || "";
      }
      const response = await axiosConfig.post(API_ENDPOINTS.REGISTER, {
        fullName,
        email,
        password,
        profileImageUrl,
      });
      if (response.status === 201) {
        toast.success("Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP.");
        navigate("/activate", { state: { email } });
      }
    } catch (err) {
      console.error("Something went wrong", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0E1A] flex flex-col">
      <Header />
      <main className="mx-auto flex max-w-lg items-start justify-center px-6 py-10 flex-1">
        <div className="w-full rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden
          bg-white dark:bg-[#0F172A]">

          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                <img src={favicon} alt="Money Manager Logo" className="w-12 h-12 max-w-none object-cover scale-110" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Money<span className="text-amber-500">Manager</span></span>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Tạo tài khoản</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-7">
              Bắt đầu theo dõi thu chi của bạn ngay hôm nay.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-center mb-5">
                <ProfilePhotoSelector image={profilePhoto} setImage={setProfilePhoto} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  label="Họ và tên"
                  placeholder="Nguyễn Văn A"
                  type="text"
                />
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  label="Địa chỉ email"
                  placeholder="tenban@example.com"
                  type="text"
                />
                <div className="col-span-2">
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    label="Mật khẩu"
                    placeholder="••••••••"
                    type="password"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  {error}
                </p>
              )}

              <button
                disabled={isLoading}
                className={`btn-primary flex items-center justify-center gap-2 ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                type="submit"
              >
                {isLoading ? (
                  <>
                    <LoaderCircle className="animate-spin w-5 h-5" />
                    Đang đăng ký...
                  </>
                ) : "ĐĂNG KÝ"}
              </button>

              <p className="text-sm text-slate-600 dark:text-slate-400 text-center pt-1">
                Đã có tài khoản?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Đăng nhập
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Signup;

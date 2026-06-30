import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/Input.jsx";
import { validateEmail } from "../util/validation.js";
import axiosConfig from "../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import toast from "react-hot-toast";
import { LoaderCircle } from "lucide-react";
import ProfilePhotoSelector from "../components/ProfilePhotoSelector.jsx";
import uploadProfileImage from "../util/uploadProfileImage.js";
import Header from "../components/Header.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";
import Footer from "../components/Footer.jsx";
import favicon from "../assets/logo/favicon.png";
import { useTranslation } from "../hooks/useTranslation.js";

const Signup = () => {
  const { t } = useTranslation();
  usePageTitle(t("auth.signupPageTitle"));
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
      setError(t("auth.invalidFullName"));
      setIsLoading(false);
      return;
    }
    if (!validateEmail(email)) {
      setError(t("auth.invalidEmail"));
      setIsLoading(false);
      return;
    }
    if (!password.trim()) {
      setError(t("auth.invalidPassword"));
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
        toast.success(t("auth.signupSuccess"));
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
      <main className="w-full flex flex-1 items-start justify-center px-3 sm:px-6 py-6 sm:py-10">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden
          bg-white dark:bg-[#0F172A]">

          <div className="p-5 sm:p-8">
            {/* Header */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                <img src={favicon} alt="Money Manager Logo" className="w-12 h-12 max-w-none object-cover scale-110" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Money<span className="text-amber-500">Manager</span></span>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{t("auth.createAccount")}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-7">
              {t("auth.startTracking")}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-center mb-5">
                <ProfilePhotoSelector image={profilePhoto} setImage={setProfilePhoto} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  label={t("auth.fullName")}
                  placeholder={t("auth.fullNamePlaceholder")}
                  type="text"
                />
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  label={t("auth.email")}
                  placeholder={t("auth.emailPlaceholder")}
                  type="text"
                />
                <div className="sm:col-span-2">
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    label={t("auth.password")}
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
                    {t("auth.loadingSignup")}
                  </>
                ) : t("auth.signupBtn")}
              </button>

              <p className="text-sm text-slate-600 dark:text-slate-400 text-center pt-1">
                {t("auth.haveAccount")}{" "}
                <Link
                  to="/login"
                  className="font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  {t("nav.login")}
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

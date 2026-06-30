import { useContext } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import LanguageToggle from "./LanguageToggle.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import favicon from "../assets/logo/favicon.png";
import { useTranslation } from "../hooks/useTranslation.js";
import { AppContext } from "../context/AppContext.jsx";

const Header = () => {
  const { t } = useTranslation();
  const { user } = useContext(AppContext);

  return (
    <header className="border-b border-slate-200 dark:border-white/10
      bg-white/80 dark:bg-[#0F172A]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-2">
        <Link to="/home" className="flex items-center gap-2 shrink-0" aria-label="Go to home page">
          <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
            <img src={favicon} alt="Money Manager Logo" className="w-10 h-10 max-w-none object-cover scale-110" />
          </div>
          <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Money<span className="text-amber-500">Manager</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2 text-sm shrink-0">
          {/* Language toggle: hidden on very small screens */}
          <span className="hidden xs:inline-flex sm:inline-flex">
            <LanguageToggle />
          </span>
          <ThemeToggle />
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 sm:px-4 py-2 font-semibold text-white text-xs sm:text-sm
                bg-violet-600 hover:bg-violet-500 transition duration-150 transform-gpu active:scale-95 whitespace-nowrap"
            >
              <span className="hidden sm:inline">{t("nav.goToDashboard")}</span>
              <span className="sm:hidden">Dashboard</span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              {/* Signup button: hidden on mobile to prevent overflow */}
              <Link
                to="/signup"
                className="hidden sm:inline-flex items-center rounded-xl border border-slate-200 dark:border-white/10
                  bg-slate-100 dark:bg-white/5 px-4 py-2 font-medium text-slate-700 dark:text-slate-300
                  hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400 transition duration-200 whitespace-nowrap"
              >
                {t("nav.signup")}
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center rounded-xl px-3 sm:px-4 py-2 font-semibold text-white text-xs sm:text-sm
                  bg-violet-600 hover:bg-violet-500 transition duration-150 transform-gpu active:scale-95 whitespace-nowrap"
              >
                {t("nav.login")}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;

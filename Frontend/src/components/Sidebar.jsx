import { useContext } from "react";
import { AppContext } from "../context/AppContext.jsx";
import { ShieldCheck, User, Zap } from "lucide-react";
import { SIDE_BAR_DATA } from "../assets/assets.js";
import { useNavigate } from "react-router-dom";
import favicon from "../assets/logo/favicon.png";

const Sidebar = ({ activeMenu, mobileOverlay = false }) => {
  const { user } = useContext(AppContext);
  const navigate = useNavigate();

  return (
    <aside className={`h-screen w-64 fixed left-0 top-0 flex-col p-5 gap-2 z-50
      bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-white/10 ${mobileOverlay ? "flex" : "hidden lg:flex"}`}>

      {/* Logo */}
      <div
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2.5 mb-7 px-1 cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-md">
          <img src={favicon} alt="Money Manager Logo" className="w-12 h-12 max-w-none object-cover scale-110" />
        </div>
        <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
          Money<span className="text-amber-500">Manager</span>
        </span>
      </div>

      {/* User info */}
      <div className="flex items-center gap-3 mb-6 p-3 rounded-xl
        bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
        <div className="relative shrink-0">
          {user?.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt="profile"
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center">
              <User size={17} className="text-slate-500 dark:text-slate-400" />
            </div>
          )}
          {user?.subscriptionPlan === "PREMIUM" && (
            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-[8px] text-white px-1 py-0.5 rounded-full font-extrabold uppercase tracking-wider shadow-sm">
              PRE
            </span>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
              {user?.fullName || "Người dùng"}
            </p>
            {user?.role === "admin" && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-extrabold uppercase tracking-wide border border-amber-500/20 shrink-0">
                <ShieldCheck size={11} />
                Admin
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {user?.subscriptionPlan === "PREMIUM" ? "Premium" : user?.subscriptionPlan === "BASIC" ? "Basic" : "Free"}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {SIDE_BAR_DATA.map((item, index) => {
          const isActive = activeMenu === item.label;
          return (
            <button
              onClick={() => navigate(item.path)}
              key={`menu_${index}`}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150 ${
                isActive
                  ? "bg-amber-500/15 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <item.icon
                size={18}
                className={isActive ? "text-amber-500" : "text-slate-400 dark:text-slate-500"}
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Admin dashboard link */}
      {user?.role === "admin" && (
        <>
          <div className="my-2 border-t border-slate-200 dark:border-white/10" />
          <button
            onClick={() => navigate("/admin")}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150
              text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10
              border border-transparent hover:border-violet-500/20"
          >
            <ShieldCheck size={18} className="text-violet-500" />
            Trang quản trị
          </button>
        </>
      )}

      {/* Upgrade hint for free users */}
      {user?.subscriptionPlan === "FREE" && (
        <div
          onClick={() => navigate("/payment")}
          className="mt-4 p-3 rounded-xl bg-linear-to-br from-violet-600/20 to-amber-500/10
            border border-violet-500/20 cursor-pointer hover:border-violet-500/40 transition"
        >
          <p className="text-xs font-semibold text-violet-400 mb-0.5">Nâng cấp lên Premium</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Mở khoá tất cả tính năng AI</p>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

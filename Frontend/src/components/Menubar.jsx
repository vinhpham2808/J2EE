import { useState, useRef, useEffect, useContext } from "react";
import { ShieldCheck, User, LogOut, X, Menu, Bell, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext.jsx";
import Sidebar from "./Sidebar.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import NotificationDropdown from "./NotificationDropdown.jsx";
import axiosConfig from "../util/axiosConfig";
import { API_ENDPOINTS } from "../util/apiEndpoints";

const Menubar = ({ activeMenu }) => {
  const [openSideMenu, setOpenSideMenu] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { clearUser, user } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const handleOpenProfile = () => {
    setShowDropdown(false);
    navigate("/profile");
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    try {
      await axiosConfig.post(API_ENDPOINTS.LOGOUT);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      clearUser();
      navigate("/login");
    }
  };

  return (
    <header className="fixed top-0 right-0 lg:w-[calc(100%-16rem)] w-full h-16 z-40 flex justify-between items-center px-4 lg:px-6
      bg-white/80 dark:bg-[#0F172A]/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">

      {/* Left — mobile menu + search */}
      <div className="flex items-center gap-3 flex-1">
        <button
          className="block lg:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400
            hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          onClick={() => setOpenSideMenu(!openSideMenu)}
        >
          {openSideMenu ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="relative hidden sm:block w-full max-w-xs group">
          <input
            className="w-full rounded-xl pl-9 pr-4 py-2 text-sm outline-none transition-all duration-300
              bg-slate-100/50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/8
              border border-slate-200 dark:border-white/10
              text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500
              focus:bg-white dark:focus:bg-slate-900/60 focus:border-violet-500 dark:focus:border-amber-500
              focus:ring-1 focus:ring-violet-500/20 dark:focus:ring-amber-500/20
              focus:shadow-[0_0_15px_rgba(139,92,246,0.1)] dark:focus:shadow-[0_0_15px_rgba(245,158,11,0.1)]"
            placeholder="Tìm kiếm..."
            type="text"
          />
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 dark:group-focus-within:text-amber-500 transition-colors pointer-events-none" />
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <NotificationDropdown />

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center justify-center w-9 h-9 rounded-xl
              bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15
              transition-colors overflow-hidden"
          >
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <User size={17} className="text-slate-500 dark:text-slate-400" />
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl shadow-2xl z-50 overflow-hidden
              bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/10">
              <div className="px-4 py-3.5 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {user?.profileImageUrl ? (
                      <img src={user.profileImageUrl} alt="profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={16} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {user?.fullName || "Người dùng"}
                      </p>
                      {user?.role === "admin" && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-extrabold uppercase tracking-wide border border-amber-500/20 shrink-0">
                          <ShieldCheck size={11} />
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email || ""}</p>
                  </div>
                </div>
              </div>

              <div className="p-2">
                {user?.role === "admin" && (
                  <button
                    onClick={() => { setShowDropdown(false); navigate("/admin"); }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-xl
                      text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10
                      transition-colors"
                  >
                    <ShieldCheck size={15} />
                    Trang quản trị
                  </button>
                )}
                <button
                  onClick={handleOpenProfile}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-xl
                    text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5
                    transition-colors"
                >
                  <User size={15} />
                  Hồ sơ cá nhân
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-xl
                    text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10
                    transition-colors mt-1"
                >
                  <LogOut size={15} />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 top-16 z-30 lg:hidden transition-[visibility,opacity] duration-300 ease-in-out ${
          openSideMenu ? 'visible' : 'invisible'
        }`}
      >
        {/* Backdrop — click outside to close */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
            openSideMenu ? 'opacity-100' : 'opacity-0'
          } bg-black/40 backdrop-blur-sm`}
          onClick={() => setOpenSideMenu(false)}
        />

        {/* Sidebar panel */}
        <div
          className={`relative transition-transform duration-300 ease-in-out ${
            openSideMenu ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="w-64 h-full">
            <Sidebar activeMenu={activeMenu} mobileOverlay={true} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Menubar;

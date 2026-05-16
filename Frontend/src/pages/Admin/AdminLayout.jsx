import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Wallet, Settings, LogOut, Package, Menu, X, ArrowLeft, Sun, Moon, Bell, Users, Sparkles } from "lucide-react";
import { useContext, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import Footer from "../../components/Footer.jsx";

const AdminLayout = () => {
  const { clearUser } = useContext(AppContext);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    clearUser();
    navigate("/login");
  };

  const NavItem = ({ to, icon: Icon, label, exact, onClick }) => {
    const isActive = exact
      ? location.pathname === to
      : location.pathname === to || location.pathname.startsWith(`${to}/`);
    return (
      <Link
        to={to}
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
          isActive
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white font-medium"
        }`}
      >
        <Icon size={20} className={isActive ? "text-amber-500" : "text-slate-400 dark:text-slate-500"} />
        <span>{label}</span>
      </Link>
    );
  };

  const closeSidebar = () => setSidebarOpen(false);

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-amber-500">Bảng Quản Trị</h2>
        <button
          className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          onClick={closeSidebar}
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <NavItem to="/admin" icon={LayoutDashboard} label="Bảng điều khiển" exact onClick={closeSidebar} />
        <NavItem to="/admin/users" icon={Users} label="Người dùng" onClick={closeSidebar} />
        <NavItem to="/admin/payments" icon={Wallet} label="Thanh toán" onClick={closeSidebar} />
        <NavItem to="/admin/subscriptions" icon={Package} label="Gói cước" onClick={closeSidebar} />
        <NavItem to="/admin/notifications" icon={Bell} label="Thông báo" onClick={closeSidebar} />
        <NavItem to="/admin/ai-limits" icon={Sparkles} label="Hạn mức AI" onClick={closeSidebar} />
        <NavItem to="/admin/settings" icon={Settings} label="Cài đặt" onClick={closeSidebar} />
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-white/10 space-y-2">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Quay lại ứng dụng</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={20} className="text-red-500 dark:text-red-400" />
          <span className="font-medium">Đăng xuất</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0A0E1A] font-sans text-slate-800 dark:text-slate-200">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-white/10">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeSidebar}
          />
          <aside className="absolute left-0 top-0 h-full w-64 flex flex-col bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-white/10 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0F172A]/90 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-slate-800 dark:text-white">
              {location.pathname === "/admin" && "Bảng điều khiển"}
              {location.pathname.startsWith("/admin/users") && "Người dùng"}
              {location.pathname.startsWith("/admin/payments") && "Thanh toán"}
              {location.pathname.startsWith("/admin/subscriptions") && "Gói cước"}
              {location.pathname.startsWith("/admin/notifications") && "Thông báo"}
              {location.pathname.startsWith("/admin/settings") && "Cài đặt"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              title={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-medium"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto flex-1">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

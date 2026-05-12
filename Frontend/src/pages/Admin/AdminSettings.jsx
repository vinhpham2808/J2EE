import { useEffect, useState } from "react";
import { RotateCcw, Save, SlidersHorizontal, ChevronDown } from "lucide-react";
import { usePageTitle } from "../../hooks/usePageTitle.js";

const ADMIN_SETTINGS_KEY = "admin_settings";

const defaultSettings = {
  autoRefresh: false,
  defaultPaymentStatus: "ALL",
  paymentPageSize: 20,
  compactTable: false
};

const AdminSettings = () => {
  usePageTitle("Cài đặt hệ thống");
  const [settings, setSettings] = useState(defaultSettings);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(ADMIN_SETTINGS_KEY) || "{}");
      setSettings({ ...defaultSettings, ...saved });
    } catch {
      setSettings(defaultSettings);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
    setMessage("Đã lưu cài đặt thành công");
    setTimeout(() => setMessage(""), 2500);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(defaultSettings));
    setMessage("Đã khôi phục cài đặt mặc định");
    setTimeout(() => setMessage(""), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Settings</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Cấu hình nhanh cho khu vực admin mà không ảnh hưởng chức năng hiện tại.</p>
      </div>

      <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm space-y-5">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <SlidersHorizontal size={18} />
          Dashboard Preferences
        </h2>

        <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-white/10">
          <div>
            <p className="font-medium text-slate-700 dark:text-slate-300">Auto refresh payment data</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Tự động làm mới danh sách thanh toán mỗi 20 giây</p>
          </div>
          <input
            type="checkbox"
            checked={settings.autoRefresh}
            onChange={(e) => setSettings((prev) => ({ ...prev, autoRefresh: e.target.checked }))}
            className="w-5 h-5 accent-blue-600"
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Default payment status filter</span>
            <div className="relative">
              <select
                value={settings.defaultPaymentStatus}
                onChange={(e) => setSettings((prev) => ({ ...prev, defaultPaymentStatus: e.target.value }))}
                className="w-full px-3 py-2.5 pr-8 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 focus:outline-none appearance-none"
              >
                <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">ALL</option>
                <option value="PAID" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">PAID</option>
                <option value="PENDING" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">PENDING</option>
                <option value="PROCESSING" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">PROCESSING</option>
                <option value="UNDERPAID" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">UNDERPAID</option>
                <option value="FAILED" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">FAILED</option>
                <option value="CANCELLED" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">CANCELLED</option>
                <option value="EXPIRED" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">EXPIRED</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" />
            </div>
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Rows per payment page</span>
            <div className="relative">
              <select
                value={settings.paymentPageSize}
                onChange={(e) => setSettings((prev) => ({ ...prev, paymentPageSize: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 pr-8 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 focus:outline-none appearance-none"
              >
                <option value={10} className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">10</option>
                <option value={20} className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">20</option>
                <option value={30} className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">30</option>
                <option value={50} className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">50</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" />
            </div>
          </label>
        </div>

        <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-white/10">
          <div>
            <p className="font-medium text-slate-700 dark:text-slate-300">Compact payment table</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Dùng kiểu bảng gọn cho màn hình nhỏ</p>
          </div>
          <input
            type="checkbox"
            checked={settings.compactTable}
            onChange={(e) => setSettings((prev) => ({ ...prev, compactTable: e.target.checked }))}
            className="w-5 h-5 accent-blue-600"
          />
        </label>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
          >
            <Save size={16} /> Save settings
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition"
          >
            <RotateCcw size={16} /> Reset default
          </button>
          {message && <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{message}</span>}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

import { useState } from "react";
import {
  RotateCcw,
  Save,
  SlidersHorizontal,
  ChevronDown,
  RefreshCw,
  LayoutGrid,
  Table2,
  Check,
  Rows3,
} from "lucide-react";
import { usePageTitle } from "../../hooks/usePageTitle.js";

const ADMIN_SETTINGS_KEY = "admin_settings";

const defaultSettings = {
  autoRefresh: false,
  defaultPaymentStatus: "ALL",
  paymentPageSize: 20,
  compactTable: false,
};

const loadAdminSettings = () => {
  try {
    const savedData = JSON.parse(localStorage.getItem(ADMIN_SETTINGS_KEY) || "{}");
    return { ...defaultSettings, ...savedData };
  } catch {
    return defaultSettings;
  }
};

// ─── Toggle Switch ─────────────────────────────────────────────────────────────
const ToggleSwitch = ({ checked, onChange, id }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer shrink-0 ${
      checked ? "bg-indigo-600" : "bg-slate-200 dark:bg-white/10"
    }`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
        checked ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

// ─── Section Card ──────────────────────────────────────────────────────────────
const SectionCard = ({ icon: Icon, title, description, accentColor = "indigo", children }) => {
  const accentMap = {
    indigo: "from-indigo-500 to-violet-600",
    blue: "from-blue-400 to-indigo-500",
    violet: "from-violet-400 to-purple-500",
    emerald: "from-emerald-400 to-teal-500",
  };
  const iconMap = {
    indigo: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-500",
    violet: "bg-violet-50 dark:bg-violet-500/10 text-violet-500",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500",
  };
  return (
    <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
      <div className="relative px-6 pt-6 pb-5 border-b border-slate-100 dark:border-white/5">
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${accentMap[accentColor]}`} />
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconMap[accentColor]}`}>
            <Icon size={16} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{title}</h2>
            {description && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
};

// ─── Setting Row ───────────────────────────────────────────────────────────────
const SettingRow = ({ label, description, children }) => (
  <div className="flex items-center justify-between gap-4 py-4 border-b border-slate-100 dark:border-white/5 last:border-0 last:pb-0">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</p>
      {description && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">{description}</p>
      )}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

// ─── Page Size Option ──────────────────────────────────────────────────────────
const PageSizeOption = ({ value, current, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(value)}
    className={`w-14 h-10 rounded-xl text-sm font-bold transition-all cursor-pointer ${
      current === value
        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
        : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
    }`}
  >
    {value}
  </button>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const AdminSettings = () => {
  usePageTitle("Cài đặt hệ thống", "Money Manager Admin");
  const [settings, setSettings] = useState(loadAdminSettings);
  const [saved, setSaved] = useState(false);
  const [reset, setReset] = useState(false);

  const handleSave = () => {
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(defaultSettings));
    setReset(true);
    setTimeout(() => setReset(false), 2500);
  };

  const STATUS_OPTIONS = ["ALL", "PAID", "PENDING", "PROCESSING", "UNDERPAID", "FAILED", "CANCELLED", "EXPIRED"];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-white/8 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
              <SlidersHorizontal size={17} />
            </span>
            Cài đặt admin
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 pl-11">
            Tùy chỉnh giao diện và hành vi bảng quản trị theo sở thích của bạn.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pl-11 sm:pl-0">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer"
          >
            <RotateCcw size={14} className={reset ? "animate-spin" : ""} />
            Mặc định
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all cursor-pointer active:scale-[0.97]"
          >
            {saved ? (
              <>
                <Check size={14} />
                Đã lưu!
              </>
            ) : (
              <>
                <Save size={14} />
                Lưu cài đặt
              </>
            )}
          </button>
        </div>
      </div>

      {/* Saved / Reset banners */}
      {(saved || reset) && (
        <div
          className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border text-sm font-semibold animate-in fade-in slide-in-from-top-2 duration-300 ${
            saved
              ? "bg-emerald-50 dark:bg-emerald-500/8 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
              : "bg-blue-50 dark:bg-blue-500/8 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400"
          }`}
        >
          <Check size={16} />
          {saved ? "Đã lưu cài đặt thành công!" : "Đã khôi phục về mặc định!"}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── Dashboard Behavior ── */}
        <SectionCard
          icon={RefreshCw}
          title="Hành vi bảng điều khiển"
          description="Cấu hình cách các bảng và dữ liệu hoạt động"
          accentColor="indigo"
        >
          <SettingRow
            label="Tự động làm mới thanh toán"
            description="Danh sách thanh toán sẽ tự động cập nhật mỗi 20 giây"
          >
            <ToggleSwitch
              id="auto-refresh-toggle"
              checked={settings.autoRefresh}
              onChange={(val) => setSettings((prev) => ({ ...prev, autoRefresh: val }))}
            />
          </SettingRow>

          <SettingRow
            label="Bảng thanh toán thu gọn"
            description="Giảm khoảng cách giữa các dòng để hiển thị nhiều mục hơn"
          >
            <ToggleSwitch
              id="compact-table-toggle"
              checked={settings.compactTable}
              onChange={(val) => setSettings((prev) => ({ ...prev, compactTable: val }))}
            />
          </SettingRow>
        </SectionCard>

        {/* ── Display Size ── */}
        <SectionCard
          icon={Table2}
          title="Số dòng mỗi trang"
          description="Số lượng bản ghi hiển thị tối đa trong danh sách thanh toán"
          accentColor="indigo"
        >
          <div className="py-2">
            <div className="flex items-center gap-2 flex-wrap">
              {[10, 20, 30, 50, 100].map((v) => (
                <PageSizeOption
                  key={v}
                  value={v}
                  current={settings.paymentPageSize}
                  onChange={(val) => setSettings((prev) => ({ ...prev, paymentPageSize: val }))}
                />
              ))}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
              Hiện đang hiển thị tối đa{" "}
              <span className="font-bold text-slate-600 dark:text-slate-300">{settings.paymentPageSize}</span>{" "}
              dòng mỗi lần tải.
            </p>
          </div>
        </SectionCard>

        {/* ── Default Payment Status ── */}
        <SectionCard
          icon={Rows3}
          title="Lọc thanh toán mặc định"
          description="Trạng thái được chọn mặc định khi mở trang Thanh toán"
          accentColor="indigo"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 py-1">
            {STATUS_OPTIONS.map((opt) => {
              const isActive = settings.defaultPaymentStatus === opt;
              const colorMap = {
                ALL: "border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300",
                PAID: "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                PENDING: "border-amber-400 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
                PROCESSING: "border-amber-400 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
                UNDERPAID: "border-orange-400 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400",
                FAILED: "border-red-400 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400",
                CANCELLED: "border-red-400 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400",
                EXPIRED: "border-rose-400 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400",
              };
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSettings((prev) => ({ ...prev, defaultPaymentStatus: opt }))}
                  className={`relative flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? colorMap[opt] + " ring-2 ring-violet-500/30 shadow-sm"
                      : "border-slate-200 dark:border-white/8 bg-transparent text-slate-500 dark:text-slate-500 hover:border-slate-300 dark:hover:border-white/15"
                  }`}
                >
                  {opt === "ALL" ? "TẤT CẢ" : opt}
                  {isActive && (
                    <span className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center ml-1 shrink-0">
                      <Check size={10} className="text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* ── Table Layout Preview ── */}
        <SectionCard
          icon={LayoutGrid}
          title="Xem trước bố cục bảng"
          description="Hình ảnh thể hiện kiểu hiển thị bảng thanh toán hiện tại"
          accentColor="indigo"
        >
          <div className="rounded-2xl border border-slate-100 dark:border-white/8 overflow-hidden">
            {/* Mini table header */}
            <div className="grid grid-cols-3 gap-0 bg-slate-50 dark:bg-white/3 px-4 py-2 border-b border-slate-100 dark:border-white/5">
              {["Mã đơn", "Trạng thái", "Số tiền"].map((h) => (
                <span key={h} className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {h}
                </span>
              ))}
            </div>
            {/* Mini rows */}
            {[
              { code: "#10482", status: "PAID", amount: "99.000₫", color: "text-emerald-500" },
              { code: "#10481", status: "PENDING", amount: "199.000₫", color: "text-amber-500" },
              { code: "#10480", status: "FAILED", amount: "49.000₫", color: "text-red-500" },
            ].map((row) => (
              <div
                key={row.code}
                className={`grid grid-cols-3 gap-0 px-4 border-b border-slate-50 dark:border-white/3 last:border-0 ${
                  settings.compactTable ? "py-1.5" : "py-3"
                } transition-all duration-300`}
              >
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{row.code}</span>
                <span className={`text-xs font-bold ${row.color}`}>{row.status}</span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{row.amount}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
            Chế độ{" "}
            <span className="font-bold text-slate-600 dark:text-slate-300">
              {settings.compactTable ? "Thu gọn" : "Đầy đủ"}
            </span>{" "}
            — {settings.compactTable ? "ít khoảng cách hơn, hiển thị nhiều hàng hơn." : "khoảng cách thoáng, dễ đọc hơn."}
          </p>
        </SectionCard>
      </div>

      {/* ── Bottom action bar ── */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer"
        >
          <RotateCcw size={14} />
          Khôi phục mặc định
        </button>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all cursor-pointer active:scale-[0.97]"
        >
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? "Đã lưu!" : "Lưu cài đặt"}
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;

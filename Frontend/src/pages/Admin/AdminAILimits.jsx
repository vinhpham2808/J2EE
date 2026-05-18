import { useState } from "react";
import { Sparkles, RefreshCcw, Users, LoaderCircle } from "lucide-react";
import axiosConfig from "../../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../../util/apiEndpoints.js";
import toast from "react-hot-toast";
import { usePageTitle } from "../../hooks/usePageTitle.js";

const AdminAILimits = () => {
  usePageTitle("Hạn mức AI", "Money Manager Admin");
  const [resettingAll, setResettingAll] = useState(false);


  const handleResetAll = async () => {
    if (!window.confirm("CẢNH BÁO: Hành động này sẽ reset lại toàn bộ hạn mức sử dụng AI (Chat, Agent, Phân tích) của TẤT CẢ người dùng về 0. Bạn có chắc chắn không?")) return;

    setResettingAll(true);
    try {
      const res = await axiosConfig.post(API_ENDPOINTS.ADMIN_RESET_ALL_AI_LIMITS);
      toast.success(res.data.message || "Đã reset thành công toàn bộ hạn mức AI!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset thất bại.");
    } finally {
      setResettingAll(false);
    }
  };



  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles size={24} className="text-violet-500" />
          Quản lý Hạn mức AI
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Khôi phục chu kỳ sử dụng các tính năng Trợ lý thông minh cho người dùng.
        </p>
      </div>

      <div className="flex justify-center mt-8">
        {/* Reset All Card */}
        <div className="w-full max-w-lg rounded-2xl border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-500/5 p-8 flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center mb-5">
            <Users size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Reset Tất Cả Người Dùng</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-sm">
            Thao tác này sẽ xoá bỏ số lượt AI đã sử dụng của <strong>TẤT CẢ</strong> các tài khoản trên hệ thống.
            Mọi người sẽ bắt đầu lại chu kỳ 5H mới.
          </p>
          <button
            onClick={handleResetAll}
            disabled={resettingAll}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-8 py-3.5 text-base font-semibold text-white transition-colors disabled:opacity-50 w-full"
          >
            {resettingAll ? (
              <><LoaderCircle size={20} className="animate-spin" /> Đang xử lý...</>
            ) : (
              <><RefreshCcw size={20} /> Xác nhận Reset Toàn Bộ</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminAILimits;

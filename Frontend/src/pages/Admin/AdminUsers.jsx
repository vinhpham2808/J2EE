import { useEffect, useState, useCallback } from "react";
import { Search, UserCircle2, Shield, Trash2, Edit2, X, Check, LoaderCircle, ChevronDown, RefreshCw, AlertTriangle } from "lucide-react";
import axiosConfig from "../../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../../util/apiEndpoints.js";
import toast from "react-hot-toast";
import { usePageTitle } from "../../hooks/usePageTitle.js";

const PLANS = ["ALL", "FREE", "BASIC", "PREMIUM"];
const STATUS_OPTS = ["ALL", "active", "inactive"];

const planBadge = (plan) => {
  const map = {
    FREE: "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300",
    BASIC: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300",
    PREMIUM: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300",
  };
  return map[plan] || map.FREE;
};

const roleBadge = (role) =>
  role === "admin"
    ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300"
    : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400";

// ─── Custom Confirm Modal ─────────────────────────────────────────────────────
const ConfirmModal = ({ isOpen, title, message, onConfirm, onClose, confirmText = "Xác nhận", cancelText = "Hủy", isDanger = false, isLoading = false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className={`absolute top-0 left-0 w-full h-1.5 ${isDanger ? 'bg-red-500' : 'bg-indigo-600'}`} />
        
        <div className="flex gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isDanger ? 'bg-red-100 dark:bg-red-500/10 text-red-500' : 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'}`}>
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl text-white font-semibold flex items-center gap-2 shadow-md transition-all duration-300 disabled:opacity-50 ${
              isDanger 
                ? 'bg-red-600 hover:bg-red-500 shadow-red-600/15 hover:shadow-red-600/30' 
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/15 hover:shadow-indigo-600/30'
            }`}
          >
            {isLoading ? <LoaderCircle size={16} className="animate-spin" /> : null}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Edit Modal ──────────────────────────────────────────────────────────────
const EditModal = ({ user, onClose, onSaved }) => {
  const [fullName, setFullName] = useState(user.fullName || "");
  const [isActive, setIsActive] = useState(user.isActive ?? true);
  const [plan, setPlan] = useState(user.subscriptionPlan || "FREE");
  const [role, setRole] = useState(user.role || "user");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axiosConfig.put(API_ENDPOINTS.ADMIN_USER_UPDATE(user.id), {
        fullName,
        isActive,
        subscriptionPlan: plan,
        role,
      });
      toast.success("Đã cập nhật người dùng.");
      onSaved(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Cập nhật thất bại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/10">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Chỉnh sửa người dùng</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {/* Avatar + email (read-only) */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            {user.profileImageUrl
              ? <img src={user.profileImageUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
              : <UserCircle2 size={40} className="text-slate-400" />}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.email}</p>
              <p className="text-xs text-slate-400 truncate mt-0.5">ID: {user.id}</p>
            </div>
          </div>

          {/* Full name */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Họ và tên</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-transparent px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all"
            />
          </div>

          {/* Plan */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Gói đăng ký</label>
            <div className="relative">
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 pr-10 cursor-pointer transition-all"
              >
                {["FREE", "BASIC", "PREMIUM"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Vai trò</label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 pr-10 cursor-pointer transition-all"
              >
                <option value="user">Người dùng</option>
                <option value="admin">Quản trị viên</option>
              </select>
              <ChevronDown size={14} className="absolute right-4.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-white/10">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Trạng thái tài khoản</p>
              <p className="text-xs text-slate-400 mt-0.5">{isActive ? "Đang hoạt động" : "Đã vô hiệu hóa"}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6.5 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${isActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/20"}`}
            >
              <span className={`inline-block h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-2">
          <button onClick={onClose} className="flex-1 rounded-2xl border border-slate-200 dark:border-white/10 px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-4 py-3 text-sm font-bold text-white transition-all hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-60 cursor-pointer"
          >
            {saving ? <><LoaderCircle size={15} className="animate-spin" />Đang lưu...</> : <><Check size={15} />Lưu thay đổi</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AdminUsers = () => {
  usePageTitle("Quản lý người dùng", "Money Manager Admin");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editingUser, setEditingUser] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (planFilter !== "ALL") params.plan = planFilter;
      if (statusFilter !== "ALL") params.status = statusFilter;
      const res = await axiosConfig.get(API_ENDPOINTS.ADMIN_USERS, { params });
      setUsers(res.data);
    } catch {
      toast.error("Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  }, [search, planFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDeleteTrigger = (user) => {
    setDeletingUser(user);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    const id = deletingUser.id;
    setDeletingId(id);
    try {
      await axiosConfig.delete(API_ENDPOINTS.ADMIN_USER_DELETE(id));
      toast.success("Đã xóa người dùng.");
      setUsers(prev => prev.filter(u => u.id !== id));
      setDeletingUser(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Xóa thất bại.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = (updated) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    setEditingUser(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Quản lý người dùng</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{users.length} người dùng đã đăng ký</p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 group">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="search-input pl-10 w-full"
          />
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
        </div>
        <div className="flex flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="appearance-none w-full md:w-44 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] px-4 py-3 pr-10 text-sm font-medium text-slate-950 dark:text-white focus:border-indigo-600 focus:outline-none cursor-pointer"
            >
              {PLANS.map(p => <option key={p} value={p}>{p === "ALL" ? "Tất cả gói" : p}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative flex-1 md:flex-none">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none w-full md:w-48 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] px-4 py-3 pr-10 text-sm font-medium text-slate-950 dark:text-white focus:border-indigo-600 focus:outline-none cursor-pointer"
            >
              {STATUS_OPTS.map(s => (
                <option key={s} value={s}>
                  {s === "ALL" ? "Tất cả trạng thái" : s === "active" ? "Đang hoạt động" : "Vô hiệu hóa"}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main View Container */}
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoaderCircle size={32} className="animate-spin text-indigo-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <UserCircle2 size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-medium">Không tìm thấy người dùng nào.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Người dùng</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vai trò</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gói</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ngày tạo</th>
                    <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-white/2 transition-colors">
                      {/* User info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {user.profileImageUrl
                            ? <img src={user.profileImageUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                            : <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                              <UserCircle2 size={20} className="text-slate-400" />
                            </div>}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">{user.fullName || "—"}</p>
                            <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadge(user.role)}`}>
                          {user.role === "admin" ? <Shield size={10} /> : null}
                          {user.role || "user"}
                        </span>
                      </td>

                      {/* Plan */}
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${planBadge(user.subscriptionPlan)}`}>
                          {user.subscriptionPlan || "FREE"}
                        </span>
                      </td>

                      {/* Active status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${user.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/20"}`} />
                          {user.isActive ? "Hoạt động" : "Vô hiệu hóa"}
                        </span>
                      </td>

                      {/* Created */}
                      <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteTrigger(user)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Xóa tài khoản"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card Grid View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
              {users.map((user) => (
                <div key={user.id} className="p-5 flex flex-col gap-4 hover:bg-slate-50/30 dark:hover:bg-white/2 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {user.profileImageUrl ? (
                        <img src={user.profileImageUrl} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                          <UserCircle2 size={22} className="text-slate-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate text-base">{user.fullName || "—"}</h4>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 items-end shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${roleBadge(user.role)}`}>
                        {user.role === "admin" ? <Shield size={8} /> : null}
                        {user.role || "user"}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${planBadge(user.subscriptionPlan)}`}>
                        {user.subscriptionPlan || "FREE"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs border-t border-slate-100 dark:border-white/5 pt-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-400 font-medium">Trạng thái</span>
                      <span className={`inline-flex items-center gap-1.5 font-bold ${user.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/20"}`} />
                        {user.isActive ? "Hoạt động" : "Vô hiệu hóa"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className="text-slate-400 font-medium">Ngày tạo</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 mt-2">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <Edit2 size={13} />
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => handleDeleteTrigger(user)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                      Xóa tài khoản
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {editingUser && (
        <EditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={handleSaved}
        />
      )}

      <ConfirmModal
        isOpen={!!deletingUser}
        title="Xóa người dùng"
        message={`Bạn có chắc chắn muốn xóa người dùng "${deletingUser?.fullName || deletingUser?.email || ""}" không? Hành động này sẽ xóa vĩnh viễn tài khoản và không thể hoàn tác.`}
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy bỏ"
        isDanger={true}
        isLoading={deletingId === deletingUser?.id}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingUser(null)}
      />
    </div>
  );
};

export default AdminUsers;

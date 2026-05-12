import { useEffect, useState, useCallback } from "react";
import { Search, UserCircle2, Shield, ShieldOff, Trash2, Edit2, X, Check, LoaderCircle, ChevronDown, RefreshCw } from "lucide-react";
import axiosConfig from "../../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../../util/apiEndpoints.js";
import toast from "react-hot-toast";

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
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Chỉnh sửa người dùng</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Avatar + email (read-only) */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5">
            {user.profileImageUrl
              ? <img src={user.profileImageUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
              : <UserCircle2 size={40} className="text-slate-400" />}
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{user.email}</p>
              <p className="text-xs text-slate-400">ID: {user.id}</p>
            </div>
          </div>

          {/* Full name */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Họ và tên</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Plan */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Gói đăng ký</label>
            <div className="relative">
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 pr-8"
              >
                {["FREE", "BASIC", "PREMIUM"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Vai trò</label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 pr-8"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-white/10">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Trạng thái tài khoản</p>
              <p className="text-xs text-slate-400">{isActive ? "Đang hoạt động" : "Đã vô hiệu hóa"}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${isActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/20"}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60"
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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editingUser, setEditingUser] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa người dùng này? Hành động này không thể hoàn tác.")) return;
    setDeletingId(id);
    try {
      await axiosConfig.delete(API_ENDPOINTS.ADMIN_USER_DELETE(id));
      toast.success("Đã xóa người dùng.");
      setUsers(prev => prev.filter(u => u.id !== id));
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
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quản lý người dùng</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{users.length} người dùng</p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        >
          <RefreshCw size={15} />
          Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <div className="relative">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="appearance-none rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] px-4 py-2.5 pr-8 text-sm text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
          >
            {PLANS.map(p => <option key={p} value={p}>{p === "ALL" ? "Tất cả gói" : p}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] px-4 py-2.5 pr-8 text-sm text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
          >
            {STATUS_OPTS.map(s => (
              <option key={s} value={s}>
                {s === "ALL" ? "Tất cả trạng thái" : s === "active" ? "Đang hoạt động" : "Vô hiệu hóa"}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoaderCircle size={28} className="animate-spin text-amber-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <UserCircle2 size={40} className="mb-3 opacity-40" />
            <p className="text-sm">Không tìm thấy người dùng nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Người dùng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Vai trò</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Gói</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ngày tạo</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    {/* User info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.profileImageUrl
                          ? <img src={user.profileImageUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                          : <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                              <UserCircle2 size={18} className="text-slate-400" />
                            </div>}
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white truncate">{user.fullName || "—"}</p>
                          <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge(user.role)}`}>
                        {user.role === "admin" ? <Shield size={10} /> : null}
                        {user.role || "user"}
                      </span>
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${planBadge(user.subscriptionPlan)}`}>
                        {user.subscriptionPlan || "FREE"}
                      </span>
                    </td>

                    {/* Active status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/20"}`} />
                        {user.isActive ? "Hoạt động" : "Vô hiệu hóa"}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "—"}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={deletingId === user.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Xóa"
                        >
                          {deletingId === user.id
                            ? <LoaderCircle size={15} className="animate-spin" />
                            : <Trash2 size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingUser && (
        <EditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default AdminUsers;

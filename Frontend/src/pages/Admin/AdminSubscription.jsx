import { useEffect, useState } from "react";
import { Plus, Trash2, Save, X, Edit2, ChevronDown, RefreshCw, AlertTriangle, LoaderCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import axiosConfig from "../../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../../util/apiEndpoints.js";

const DEFAULT_NEW_PLAN = {
  planId: "pkg_new",
  subscriptionPlan: "PREMIUM",
  displayName: "Gói mới",
  amount: 100000,
  description: "Mô tả gói dịch vụ",
  badge: "Mới",
  cycleLabel: "1 tháng",
  cycleMonths: 1,
  icon: "Star",
  accent: "from-indigo-600 via-indigo-500 to-violet-500",
  features: ["Tính năng 1", "Tính năng 2"],
  displayOrder: 99,
};

// ─── Confirm Modal ─────────────────────────────────────────────────────────────
const ConfirmModal = ({ isOpen, title, message, onConfirm, onClose, confirmText = "Xác nhận", cancelText = "Hủy", isDanger = false, isLoading = false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
          <button onClick={onClose} disabled={isLoading} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50">
            {cancelText}
          </button>
          <button onClick={onConfirm} disabled={isLoading} className={`px-5 py-2.5 rounded-xl text-white font-semibold flex items-center gap-2 shadow-md transition-all duration-300 disabled:opacity-50 ${isDanger ? 'bg-red-600 hover:bg-red-500 shadow-red-600/15 hover:shadow-red-600/30' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/15 hover:shadow-indigo-500/30'}`}>
            {isLoading ? <LoaderCircle size={16} className="animate-spin" /> : null}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Edit/Create Plan Modal ────────────────────────────────────────────────────
const PlanFormModal = ({ isOpen, editingPlan, formData, setFormData, onSave, onClose, saving }) => {
  if (!isOpen || !formData) return null;

  const updateFeature = (fIndex, val) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures[fIndex] = val;
    setFormData({ ...formData, features: updatedFeatures });
  };
  const addFeature = () => setFormData({ ...formData, features: [...formData.features, "Tính năng mới"] });
  const removeFeature = (fIndex) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures.splice(fIndex, 1);
    setFormData({ ...formData, features: updatedFeatures });
  };

  const inputCls = "w-full border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none transition-all text-sm font-medium placeholder-slate-400 dark:placeholder-slate-500";
  const labelCls = "text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl my-8 rounded-3xl border border-white/10 bg-white dark:bg-[#0D1526] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top accent stripe */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600" />

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-slate-100 dark:border-white/8">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {editingPlan?.isNew ? "✨ Thêm gói dịch vụ mới" : "✏️ Chỉnh sửa gói dịch vụ"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {editingPlan?.isNew ? "Cấu hình thông tin cho gói thanh toán mới" : `Đang chỉnh sửa: ${formData.displayName}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {/* LEFT COLUMN */}
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Tên gói hiển thị</label>
                <input type="text" value={formData.displayName} onChange={e => setFormData({ ...formData, displayName: e.target.value })} className={inputCls} placeholder="VD: Gói Premium..." />
              </div>
              <div>
                <label className={labelCls}>Mã kế hoạch (planId)</label>
                <input
                  type="text"
                  value={formData.planId}
                  onChange={e => setFormData({ ...formData, planId: e.target.value })}
                  disabled={!editingPlan?.isNew}
                  className={`${inputCls} ${!editingPlan?.isNew ? "opacity-50 cursor-not-allowed" : ""}`}
                />
              </div>
              <div>
                <label className={labelCls}>Giá (VND)</label>
                <input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Mức độ đặc quyền (Role)</label>
                <div className="relative">
                  <select
                    value={formData.subscriptionPlan}
                    onChange={e => setFormData({ ...formData, subscriptionPlan: e.target.value })}
                    className={`${inputCls} pr-10 appearance-none cursor-pointer`}
                  >
                    <option value="FREE">FREE</option>
                    <option value="BASIC">BASIC</option>
                    <option value="PREMIUM">PREMIUM</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Hệ thống phân biệt quyền truy cập dựa trên giá trị này</p>
              </div>
              <div>
                <label className={labelCls}>Nhãn thẻ (Badge)</label>
                <input type="text" value={formData.badge} onChange={e => setFormData({ ...formData, badge: e.target.value })} placeholder="VD: Phổ biến, Nâng cao..." className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Chu kỳ (Tháng)</label>
                  <input type="number" value={formData.cycleMonths} onChange={e => setFormData({ ...formData, cycleMonths: Number(e.target.value) })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Nhãn chu kỳ</label>
                  <input type="text" value={formData.cycleLabel} onChange={e => setFormData({ ...formData, cycleLabel: e.target.value })} placeholder="1 tháng" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Thứ tự hiển thị</label>
                <input type="number" value={formData.displayOrder} onChange={e => setFormData({ ...formData, displayOrder: Number(e.target.value) })} className={inputCls} />
              </div>
            </div>

            {/* RIGHT COLUMN - Features */}
            <div>
              <label className={labelCls}>Tính năng của gói</label>
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {formData.features.map((feature, fIndex) => (
                  <div key={fIndex} className="flex gap-2 items-center group">
                    <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-2xl px-3 py-2.5 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/20 transition-all">
                      <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                      <input
                        type="text"
                        value={feature}
                        onChange={e => updateFeature(fIndex, e.target.value)}
                        className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
                        placeholder="Mô tả tính năng..."
                      />
                    </div>
                    <button
                      onClick={() => removeFeature(fIndex)}
                      className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl shrink-0 cursor-pointer transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addFeature}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all cursor-pointer"
                >
                  <Plus size={14} /> Thêm tính năng mới
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-slate-100 dark:border-white/8 bg-slate-50/50 dark:bg-white/2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-all cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold rounded-2xl flex items-center gap-2 hover:shadow-lg hover:shadow-indigo-500/20 transition-all text-sm cursor-pointer"
          >
            {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Đang lưu..." : "Lưu gói cước"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const AdminSubscription = () => {
  usePageTitle("Quản lý gói thanh toán", "Money Manager Admin");
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await axiosConfig.get(API_ENDPOINTS.GET_SUBSCRIPTION_PLANS);
      setPlans(res.data || []);
    } catch {
      toast.error("Không thể tải danh sách gói. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({ ...plan });
  };

  const handleAddNew = () => {
    setEditingPlan({ isNew: true });
    setFormData({ ...DEFAULT_NEW_PLAN });
  };

  const handleDeleteTrigger = (plan) => setDeletingPlan(plan);

  const handleConfirmDelete = async () => {
    if (!deletingPlan) return;
    setDeleting(true);
    try {
      await axiosConfig.delete(API_ENDPOINTS.ADMIN_DELETE_SUBSCRIPTION_PLAN(deletingPlan.id));
      toast.success("Đã xóa gói thanh toán.");
      setDeletingPlan(null);
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể xóa gói.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      if (editingPlan?.isNew) {
        await axiosConfig.post(API_ENDPOINTS.ADMIN_CREATE_SUBSCRIPTION_PLAN, formData);
        toast.success("Đã thêm gói mới.");
      } else {
        await axiosConfig.put(API_ENDPOINTS.ADMIN_UPDATE_SUBSCRIPTION_PLAN(editingPlan.id), formData);
        toast.success("Đã cập nhật gói thanh toán.");
      }
      setEditingPlan(null);
      setFormData(null);
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể lưu gói.");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingPlan(null);
    setFormData(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Cấu hình gói dịch vụ</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Quản lý các gói thanh toán hiển thị cho người dùng</p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={fetchPlans}
            className="px-4 py-2.5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-center gap-2 cursor-pointer transition-all text-sm"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Làm mới
          </button>
          <button
            onClick={handleAddNew}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-indigo-500/20 transition-all cursor-pointer text-sm"
          >
            <Plus size={18} /> Thêm gói
          </button>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {loading && (
          <div className="col-span-full py-20 text-center text-slate-500 dark:text-slate-400">
            <RefreshCw size={32} className="animate-spin text-indigo-600 mx-auto mb-3" />
            <p className="text-sm font-medium">Đang tải cấu hình gói dịch vụ...</p>
          </div>
        )}

        {!loading && plans.map((plan) => (
          <div key={plan.id} className="group bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm flex flex-col hover:shadow-lg hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300">
            {/* Accent bar */}
            <div className={`h-2 w-full bg-gradient-to-r ${plan.accent || "from-indigo-600 to-violet-500"}`} />

            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-5">
                <div className="min-w-0 pr-2">
                  <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-full mb-3 uppercase tracking-widest">
                    {plan.badge || "MỚI"}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{plan.displayName}</h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">ID: {plan.planId} · {plan.subscriptionPlan}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{(plan.amount || 0).toLocaleString("vi-VN")}đ</p>
                  <p className="text-xs text-slate-400 mt-0.5 font-semibold">/ {plan.cycleLabel || "tháng"}</p>
                </div>
              </div>

              <ul className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-400 flex-1 min-h-[80px]">
                {(plan.features || []).slice(0, 4).map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 dark:text-emerald-400 shrink-0 font-bold mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
                {(plan.features || []).length > 4 && (
                  <li className="text-slate-400 dark:text-slate-500 text-[10px] italic pl-4">+ {plan.features.length - 4} tính năng khác...</li>
                )}
              </ul>
            </div>

            {/* Action Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-white/8 bg-slate-50/60 dark:bg-white/3 flex gap-2.5">
              <button
                onClick={() => handleEdit(plan)}
                className="flex-1 flex justify-center items-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-xs font-bold text-white shadow-sm hover:shadow-md hover:shadow-indigo-500/20 transition-all cursor-pointer"
              >
                <Edit2 size={13} /> Chỉnh sửa
              </button>
              <button
                onClick={() => handleDeleteTrigger(plan)}
                className="p-2.5 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-2xl text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/20 transition-all shrink-0 cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {!loading && plans.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 bg-white dark:bg-[#0F172A] rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
            <p className="text-sm font-medium">Chưa có gói thanh toán nào được cấu hình.</p>
            <button onClick={handleAddNew} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-sm transition-all cursor-pointer">
              <Plus size={16} /> Thêm gói đầu tiên
            </button>
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      <PlanFormModal
        isOpen={editingPlan !== null && !!formData}
        editingPlan={editingPlan}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSaveEdit}
        onClose={cancelEdit}
        saving={saving}
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deletingPlan}
        title="Xóa gói dịch vụ"
        message={`Bạn có chắc chắn muốn xóa gói "${deletingPlan?.displayName}" không? Hành động này sẽ gỡ bỏ gói cước khỏi hệ thống và không thể hoàn tác.`}
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy bỏ"
        isDanger={true}
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingPlan(null)}
      />
    </div>
  );
};

export default AdminSubscription;

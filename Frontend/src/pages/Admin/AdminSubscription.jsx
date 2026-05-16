import { useEffect, useState } from "react";
import { Plus, Trash2, Save, X, Edit2, ChevronDown, RefreshCw } from "lucide-react";
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
  accent: "from-blue-600 via-blue-500 to-indigo-500",
  features: ["Tính năng 1", "Tính năng 2"],
  displayOrder: 99,
};

const AdminSubscription = () => {
  usePageTitle("Quản lý gói thanh toán", "Money Manager Admin");
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null); // null | plan object (with id for edit, no id for new)
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await axiosConfig.get(API_ENDPOINTS.GET_SUBSCRIPTION_PLANS);
      setPlans(res.data || []);
    } catch (err) {
      toast.error("Không thể tải danh sách gói. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({ ...plan });
  };

  const handleAddNew = () => {
    setEditingPlan({ isNew: true });
    setFormData({ ...DEFAULT_NEW_PLAN });
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa gói "${plan.displayName}"?`)) return;
    try {
      await axiosConfig.delete(API_ENDPOINTS.ADMIN_DELETE_SUBSCRIPTION_PLAN(plan.id));
      toast.success("Đã xóa gói thanh toán.");
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể xóa gói.");
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

  const updateFeature = (fIndex, val) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures[fIndex] = val;
    setFormData({ ...formData, features: updatedFeatures });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, "Tính năng mới"] });
  };

  const removeFeature = (fIndex) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures.splice(fIndex, 1);
    setFormData({ ...formData, features: updatedFeatures });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Cấu hình gói dịch vụ</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Quản lý các gói thanh toán hiển thị cho người dùng</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchPlans}
            className="px-4 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
          >
            <RefreshCw size={16} /> Làm mới
          </button>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl"
          >
            <Plus size={18} /> Thêm gói
          </button>
        </div>
      </div>

      {editingPlan !== null && formData ? (
        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {editingPlan?.isNew ? "Thêm gói mới" : "Chỉnh sửa gói"}
            </h2>
            <button onClick={cancelEdit} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white">
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Tên gói hiển thị</span>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500/30"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Mã kế hoạch (planId)</span>
                <input
                  type="text"
                  value={formData.planId}
                  onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                  className="w-full border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 bg-slate-50 dark:bg-white/3 text-slate-500 dark:text-slate-400"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Giá (VND)</span>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500/30"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Mức độ đặc quyền (Role)</span>
                <div className="relative">
                  <select
                    value={formData.subscriptionPlan}
                    onChange={(e) => setFormData({ ...formData, subscriptionPlan: e.target.value })}
                    className="w-full border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 pr-8 appearance-none bg-white dark:bg-white/5 text-slate-900 dark:text-white"
                  >
                    <option value="BASIC" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">BASIC</option>
                    <option value="PREMIUM" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">PREMIUM</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hệ thống phân biệt quyền truy cập dựa trên giá trị này</p>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Nhãn thẻ (Badge)</span>
                <input
                  type="text"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  placeholder="VD: Phổ biến, Nâng cao..."
                  className="w-full border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500/30"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Thứ tự hiển thị</span>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                  className="w-full border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 bg-white dark:bg-white/5 text-slate-900 dark:text-white"
                />
              </label>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Chu kỳ (Số tháng)</span>
                <input
                  type="number"
                  value={formData.cycleMonths}
                  onChange={(e) => setFormData({ ...formData, cycleMonths: Number(e.target.value) })}
                  className="w-full border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 bg-white dark:bg-white/5 text-slate-900 dark:text-white"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Nhãn chu kỳ hiển thị</span>
                <input
                  type="text"
                  value={formData.cycleLabel}
                  onChange={(e) => setFormData({ ...formData, cycleLabel: e.target.value })}
                  placeholder="VD: 1 tháng, 1 năm..."
                  className="w-full border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500/30"
                />
              </label>

              <div className="block pt-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">Tính năng của gói</span>
                <div className="space-y-2">
                  {formData.features.map((feature, fIndex) => (
                    <div key={fIndex} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(fIndex, e.target.value)}
                        className="flex-1 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-white/5 text-slate-900 dark:text-white"
                      />
                      <button onClick={() => removeFeature(fIndex)} className="p-2 text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button onClick={addFeature} className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1 mt-2">
                    <Plus size={14} /> Thêm tính năng
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-white/10 pt-6 mt-6 flex justify-end gap-3">
            <button onClick={cancelEdit} className="px-5 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl">Hủy</button>
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-xl flex items-center gap-2"
            >
              <Save size={18} /> {saving ? "Đang lưu..." : "Lưu gói cước"}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading && (
            <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
              <p>Đang tải...</p>
            </div>
          )}
          {!loading && plans.map((plan) => (
            <div key={plan.id} className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm flex flex-col">
              <div className={`h-2 w-full bg-linear-to-r ${plan.accent}`}></div>
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-full mb-3">
                      {plan.badge}
                    </span>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{plan.displayName}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">ID: {plan.planId} • Quyền: {plan.subscriptionPlan}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{(plan.amount || 0).toLocaleString()}đ</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">/ {plan.cycleLabel}</p>
                  </div>
                </div>

                <ul className="space-y-2 mb-6 text-sm text-slate-600 dark:text-slate-400 mt-6 min-h-25">
                  {(plan.features || []).slice(0, 3).map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-500 dark:text-emerald-400 mt-0.5">✓</span> {f}
                    </li>
                  ))}
                  {(plan.features || []).length > 3 && (
                    <li className="text-slate-400 dark:text-slate-500 text-xs italic">+ {plan.features.length - 3} tính năng khác...</li>
                  )}
                </ul>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 p-4 border-t border-slate-100 dark:border-white/10 flex gap-3">
                <button onClick={() => handleEdit(plan)} className="flex-1 flex justify-center items-center gap-2 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500/30 dark:hover:text-blue-400 transition">
                  <Edit2 size={16} /> Chỉnh sửa
                </button>
                <button onClick={() => handleDelete(plan)} className="p-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/30 transition">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
          {!loading && plans.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-[#0F172A] rounded-2xl border border-dashed border-slate-300 dark:border-white/10">
              <p>Chưa có gói thanh toán nào.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSubscription;

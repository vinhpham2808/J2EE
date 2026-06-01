import { useState } from "react";
import toast from "react-hot-toast";
import EmojiPickerPopup from "./EmojiPickerPopup.jsx";
import Input from "./Input.jsx";

const JAR_COLORS = [
  { value: "#8B5CF6", label: "Tím" },
  { value: "#10B981", label: "Xanh lá" },
  { value: "#F59E0B", label: "Vàng" },
  { value: "#EF4444", label: "Đỏ" },
  { value: "#3B82F6", label: "Xanh dương" },
  { value: "#EC4899", label: "Hồng" },
  { value: "#F97316", label: "Cam" },
  { value: "#06B6D4", label: "Xanh ngọc" },
  { value: "#6366F1", label: "Chàm" },
  { value: "#84CC16", label: "Xanh chuối" },
];

const buildInitialJarForm = (initialData) => ({
  name: initialData?.name || "",
  icon: initialData?.icon || "",
  color: initialData?.color || "#8B5CF6",
  targetPercentage: initialData?.targetPercentage?.toString() || "",
});

const JarForm = ({ initialData, isEditing = false, jars = [], onSave, onCancel }) => {
  const [form, setForm] = useState(() => buildInitialJarForm(initialData));
  const [balancingJarId, setBalancingJarId] = useState("");

  const originalPct = initialData ? (initialData.targetPercentage || 0) : 0;
  const currentPct = parseFloat(form.targetPercentage) || 0;
  const pctDiff = currentPct - originalPct;

  const handleChange = (key, value) => setForm({ ...form, [key]: value });

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên hũ.");
      return;
    }

    if (isEditing && pctDiff !== 0 && !balancingJarId && jars.length > 1) {
      toast.error(`Vui lòng chọn hũ đối ứng để ${pctDiff > 0 ? "giảm" : "tăng"} tỷ lệ.`);
      return;
    }

    onSave({
      name: form.name.trim(),
      icon: form.icon,
      color: form.color,
      targetPercentage: parseFloat(form.targetPercentage) || 0,
      balancingJarId: balancingJarId ? Number(balancingJarId) : null,
      balancingPercentageDiff: pctDiff,
    });
  };

  return (
    <div className="space-y-4">
      <EmojiPickerPopup
        icon={form.icon}
        onSelect={(emoji) => handleChange("icon", emoji)}
      />

      <Input
        value={form.name}
        onChange={({ target }) => handleChange("name", target.value)}
        label="Tên hũ"
        placeholder="VD: Sinh hoạt, Giải trí, Đầu tư"
        type="text"
      />

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Tỷ lệ phân bổ (%)
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const currentVal = parseFloat(form.targetPercentage) || 0;
              handleChange("targetPercentage", Math.max(0, currentVal - 1).toString());
            }}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-lg font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          >
            -
          </button>
          <input
            className="flex-1 w-full text-center rounded-xl px-4 py-2.5 text-sm outline-none transition-colors font-bold
              bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10
              text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500
              focus:border-violet-500 dark:focus:border-amber-500
              focus:ring-1 focus:ring-violet-500/30 dark:focus:ring-amber-500/30"
            value={form.targetPercentage}
            onChange={({ target }) => handleChange("targetPercentage", target.value.replace(/[^0-9.]/g, ""))}
            placeholder="VD: 55"
            type="text"
          />
          <button
            type="button"
            onClick={() => {
              const currentVal = parseFloat(form.targetPercentage) || 0;
              handleChange("targetPercentage", Math.min(100, currentVal + 1).toString());
            }}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-lg font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          >
            +
          </button>
        </div>
      </div>

      {/* Cân bằng tỷ lệ thông minh */}
      {isEditing && pctDiff !== 0 && jars.length > 1 && (
        <div className={`p-3 rounded-xl border text-xs leading-relaxed space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200 ${
          pctDiff > 0 
            ? "bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400"
            : "bg-blue-50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400"
        }`}>
          <p className="font-bold flex items-center gap-1">
            ⚖️ Tự động cân bằng tỷ lệ phân bổ:
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            {pctDiff > 0 ? (
              <>Bạn đang tăng tỷ lệ hũ này thêm <strong className="font-extrabold text-amber-600">{pctDiff.toFixed(1)}%</strong>. Vui lòng chọn hũ muốn **giảm đi {pctDiff.toFixed(1)}%** để tổng luôn bằng 100%:</>
            ) : (
              <>Bạn đang giảm tỷ lệ hũ này đi <strong className="font-extrabold text-blue-600">{Math.abs(pctDiff).toFixed(1)}%</strong>. Vui lòng chọn hũ muốn **tăng thêm {Math.abs(pctDiff).toFixed(1)}%** để tổng luôn bằng 100%:</>
            )}
          </p>
          <select
            value={balancingJarId}
            onChange={(e) => setBalancingJarId(e.target.value)}
            className="w-full mt-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 outline-none text-slate-700 dark:text-slate-300 text-xs font-semibold focus:ring-1 focus:ring-slate-400/20 cursor-pointer"
          >
            <option value="">-- Chọn hũ đối ứng để cân bằng --</option>
            {jars
              .filter(j => j.id !== initialData?.id)
              .map(j => (
                <option key={j.id} value={j.id}>
                  {j.icon || "🏺"} {j.name} (Tỷ lệ hiện tại: {j.targetPercentage}%)
                </option>
              ))
            }
          </select>
        </div>
      )}

      {/* Color picker */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Màu sắc</label>
        <div className="flex flex-wrap gap-2">
          {JAR_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => handleChange("color", c.value)}
              className={`w-8 h-8 rounded-xl transition-[box-shadow,transform] duration-150 ${
                form.color === c.value
                  ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 scale-110"
                  : "hover:scale-105"
              }`}
              style={{ backgroundColor: c.value, ringColor: c.value }}
              title={c.label}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-sm font-medium
            text-slate-600 dark:text-slate-400
            hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          Huỷ
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="add-btn add-btn-fill"
        >
          {isEditing ? "Cập nhật" : "Tạo hũ"}
        </button>
      </div>
    </div>
  );
};

export default JarForm;

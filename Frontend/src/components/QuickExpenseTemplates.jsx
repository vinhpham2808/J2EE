import { useState, useEffect, useCallback } from "react";
import { Zap, Plus, Pencil, Trash2, X, Check, LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";

const STORAGE_KEY = "quick_expense_templates";

const DEFAULT_TEMPLATES = [
  { id: "t1", emoji: "🍚", name: "Ăn cơm",   amount: 50000,  categoryId: null },
  { id: "t2", emoji: "☕", name: "Cà phê",    amount: 35000,  categoryId: null },
  { id: "t3", emoji: "⛽", name: "Xăng xe",   amount: 100000, categoryId: null },
  { id: "t4", emoji: "🛒", name: "Siêu thị",  amount: 200000, categoryId: null },
  { id: "t5", emoji: "🧋", name: "Trà sữa",   amount: 45000,  categoryId: null },
  { id: "t6", emoji: "🍜", name: "Bún phở",   amount: 60000,  categoryId: null },
];

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

// ─── sub-components ────────────────────────────────────────────────────────

const COMMON_EMOJIS = ["🍚","☕","⛽","🛒","🧋","🍜","🍔","🥤","🏥","📱","👗","🎮","🎬","📚","🏋️","🚕","✈️","🎁","💊","🧴"];

function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5
          text-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
      >
        {value || "😊"}
      </button>
      {open && (
        <div className="absolute z-50 top-12 left-0 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/10
          rounded-2xl shadow-2xl p-3 w-64">
          <p className="text-xs text-slate-400 mb-2">Chọn biểu tượng</p>
          <div className="grid grid-cols-10 gap-1">
            {COMMON_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => { onChange(e); setOpen(false); }}
                className="w-8 h-8 text-lg flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template, onUse, onEdit, onDelete, isLoading }) {
  return (
    <div className="group relative flex flex-col items-center gap-2 p-3 rounded-2xl border border-slate-200 dark:border-white/10
      bg-white dark:bg-white/3 hover:border-violet-400 dark:hover:border-amber-500/50
      hover:shadow-lg hover:shadow-violet-500/10 dark:hover:shadow-amber-500/10
      transition-all duration-200 cursor-pointer select-none"
      onClick={() => !isLoading && onUse(template)}
    >
      {/* Action buttons – luôn hiện trên mobile, hover trên desktop */}
      <div className="absolute top-1.5 right-1.5 flex sm:hidden sm:group-hover:flex gap-1 z-10">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(template); }}
          className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400
            hover:bg-violet-100 dark:hover:bg-amber-500/20 hover:text-violet-600 dark:hover:text-amber-400
            flex items-center justify-center transition-colors"
        >
          <Pencil size={11} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(template.id); }}
          className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400
            hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400
            flex items-center justify-center transition-colors"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {/* Emoji */}
      <span className="text-2xl leading-none transition-transform group-hover:scale-110 duration-200">
        {template.emoji}
      </span>

      {/* Name */}
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 text-center leading-tight line-clamp-1">
        {template.name}
      </span>

      {/* Amount */}
      <span className="text-[10px] font-medium text-violet-600 dark:text-amber-400 bg-violet-50 dark:bg-amber-500/10
        px-2 py-0.5 rounded-full">
        {fmt(template.amount)}
      </span>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 rounded-2xl bg-white/60 dark:bg-black/40 flex items-center justify-center">
          <LoaderCircle size={16} className="animate-spin text-violet-600 dark:text-amber-400" />
        </div>
      )}
    </div>
  );
}

function TemplateFormModal({ template, categories, onSave, onClose }) {
  const isNew = !template?.id || template.id.startsWith("t");
  const [form, setForm] = useState({
    emoji: template?.emoji || "😊",
    name: template?.name || "",
    amount: template?.amount ? String(template.amount) : "",
    categoryId: template?.categoryId || (categories[0]?.id ?? null),
  });

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    setForm((p) => ({ ...p, amount: raw }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("Vui lòng nhập tên mẫu"); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error("Vui lòng nhập số tiền hợp lệ"); return; }
    onSave({
      ...template,
      emoji: form.emoji,
      name: form.name.trim(),
      amount: Number(form.amount),
      categoryId: form.categoryId ? Number(form.categoryId) : null,
    });
  };

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-colors " +
    "bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 " +
    "text-slate-900 dark:text-white placeholder-slate-400 focus:border-violet-500 dark:focus:border-amber-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {isNew ? "Thêm mẫu mới" : "Chỉnh sửa mẫu"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Emoji + Name */}
        <div className="flex items-center gap-3">
          <EmojiPicker value={form.emoji} onChange={(e) => setForm((p) => ({ ...p, emoji: e }))} />
          <input
            className={inputCls}
            placeholder="Tên mẫu (VD: Ăn cơm trưa)"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Số tiền mặc định</label>
          <div className="relative">
            <input
              className={inputCls + " pr-14"}
              placeholder="50.000"
              value={form.amount ? new Intl.NumberFormat("vi-VN").format(Number(form.amount)) : ""}
              onChange={handleAmountChange}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">VND</span>
          </div>
        </div>

        {/* Category */}
        {categories.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Danh mục (tuỳ chọn)</label>
            <select
              className={inputCls + " appearance-none cursor-pointer"}
              value={form.categoryId ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value || null }))}
            >
              <option value="">Không chọn danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
            Hủy
          </button>
          <button type="button" onClick={handleSubmit}
            className="flex-1 rounded-xl bg-violet-600 hover:bg-violet-500 dark:bg-amber-500 dark:hover:bg-amber-400 py-2.5 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2">
            <Check size={15} />
            Lưu mẫu
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

const QuickExpenseTemplates = ({ categories = [], onAddExpense }) => {
  const [templates, setTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
    } catch {
      return DEFAULT_TEMPLATES;
    }
  });

  const [editingTemplate, setEditingTemplate] = useState(null); // null = closed, {} = new, {...} = edit
  const [loadingId, setLoadingId] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Persist to localStorage whenever templates change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  }, [templates]);

  const handleUse = useCallback(async (template) => {
    if (loadingId) return;
    setLoadingId(template.id);
    const today = new Date().toISOString().split("T")[0];
    const categoryId = template.categoryId || (categories[0]?.id ?? null);
    try {
      await onAddExpense({
        name: template.name,
        amount: String(template.amount),
        date: today,
        categoryId: categoryId,
        icon: template.emoji,
      });
    } finally {
      setLoadingId(null);
    }
  }, [loadingId, categories, onAddExpense]);

  const handleSaveTemplate = (saved) => {
    setTemplates((prev) => {
      const idx = prev.findIndex((t) => t.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, { ...saved, id: `tpl_${Date.now()}` }];
    });
    setEditingTemplate(null);
    toast.success(saved.id ? "Đã cập nhật mẫu chi tiêu" : "Đã thêm mẫu chi tiêu mới");
  };

  const handleDelete = (id) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast.success("Đã xoá mẫu chi tiêu");
  };

  return (
    <>
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-amber-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Zap size={15} className="text-white" fill="white" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Chi tiêu nhanh
              </h5>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Ghi nhận ngay với 1 thao tác
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditingTemplate({})}
              className="flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-amber-400
                hover:text-violet-700 dark:hover:text-amber-300 transition-colors px-2.5 py-1.5
                rounded-xl hover:bg-violet-50 dark:hover:bg-amber-500/10"
            >
              <Plus size={13} />
              Thêm mẫu
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded((v) => !v)}
              className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center
                text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors text-xs"
            >
              {isExpanded ? "▲" : "▼"}
            </button>
          </div>
        </div>

        {isExpanded && (
          <>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4 mt-1">
              Nhấn vào mẫu để ghi nhận chi tiêu ngay hôm nay. Hover để chỉnh sửa hoặc xoá.
            </p>

            {templates.length === 0 ? (
              <div
                onClick={() => setEditingTemplate({})}
                className="flex flex-col items-center justify-center gap-2 p-8 rounded-2xl border-2 border-dashed
                  border-slate-200 dark:border-white/10 cursor-pointer
                  hover:border-violet-400 dark:hover:border-amber-500/50 hover:bg-violet-50/50 dark:hover:bg-amber-500/5
                  transition-all duration-200"
              >
                <span className="text-3xl">⚡</span>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Chưa có mẫu nào</p>
                <p className="text-xs text-violet-600 dark:text-amber-400">+ Tạo mẫu chi tiêu đầu tiên</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {templates.map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    onUse={handleUse}
                    onEdit={(tpl) => setEditingTemplate(tpl)}
                    onDelete={handleDelete}
                    isLoading={loadingId === t.id}
                  />
                ))}
                {/* Add more button */}
                <button
                  type="button"
                  onClick={() => setEditingTemplate({})}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border border-dashed
                    border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500
                    hover:border-violet-400 dark:hover:border-amber-500/50 hover:text-violet-500 dark:hover:text-amber-400
                    hover:bg-violet-50/50 dark:hover:bg-amber-500/5 transition-all duration-200 min-h-[90px]"
                >
                  <Plus size={18} />
                  <span className="text-[10px] font-medium">Thêm</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit / Create Modal */}
      {editingTemplate !== null && (
        <TemplateFormModal
          template={editingTemplate}
          categories={categories}
          onSave={handleSaveTemplate}
          onClose={() => setEditingTemplate(null)}
        />
      )}
    </>
  );
};

export default QuickExpenseTemplates;

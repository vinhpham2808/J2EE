import { useState, useEffect, useRef, useMemo } from "react";
import { Check, X, ChevronDown } from "lucide-react";
import * as Lucide from "lucide-react";
import { getFieldsForIntent, INTENT_ICONS, INTENT_LABELS, normalizeAmountInput } from "../util/aiIntentParser.js";
import axiosConfig from "../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import DateInput from "./DateInput.jsx";
import { normalizeToIsoDate } from "../util/dateInput.js";
import { hasDisplayImage } from "../util/imageDisplay.js";

const CategoryIcon = ({ icon, className = "h-4 w-4 shrink-0 object-contain text-slate-500 dark:text-slate-400" }) => {
  if (!icon) return null;

  if (hasDisplayImage(icon)) {
    return <img src={icon} alt="icon" className={className} />;
  }

  const LucideIcon = Lucide[icon];
  if (LucideIcon) {
    return <LucideIcon className={className} size={16} />;
  }

  return <span className="inline-block text-sm shrink-0 leading-none">{icon}</span>;
};

const CategorySelect = ({ value, onChange, options, required, disabled, placeholder = "-- Chọn danh mục --" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none transition-all duration-200 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-1 focus:ring-violet-500/20 dark:focus:ring-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-left"
      >
        <span className={`flex items-center gap-2 truncate ${selected ? "" : "text-slate-400 dark:text-slate-500"}`}>
          {selected ? (
            <>
              <CategoryIcon icon={selected.icon} />
              <span className="font-medium">{selected.name}</span>
            </>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E293B] shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          <div
            className="px-4 py-2.5 text-sm text-slate-400 dark:text-slate-500 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
            onClick={() => { onChange(""); setOpen(false); }}
          >
            {placeholder}
          </div>
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${
                opt.value === value
                  ? "text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-500/10 font-medium"
                  : "text-slate-800 dark:text-slate-200"
              }`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              <CategoryIcon icon={opt.icon} />
              <span>{opt.name}</span>
            </div>
          ))}
        </div>
      )}
      {/* Hidden input for required validation */}
      {required && (
        <input
          tabIndex={-1}
          required
          value={value || ""}
          onChange={() => {}}
          className="absolute inset-0 opacity-0 pointer-events-none"
        />
      )}
    </div>
  );
};

const JarSelect = ({ value, onChange, options, required, disabled, placeholder = "-- Chọn hũ --" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none transition-all duration-200 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-1 focus:ring-violet-500/20 dark:focus:ring-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-left"
      >
        <span className={`flex items-center gap-2 truncate ${selected ? "" : "text-slate-400 dark:text-slate-500"}`}>
          {selected ? (
            <>
              <span className="text-base shrink-0 leading-none">{selected.icon || "🏦"}</span>
              <span className="font-medium">{selected.name}</span>
              {selected.balance !== undefined && (
                <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                  ({selected.balance.toLocaleString()}đ)
                </span>
              )}
            </>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E293B] shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          <div
            className="px-4 py-2.5 text-sm text-slate-400 dark:text-slate-500 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
            onClick={() => { onChange(""); setOpen(false); }}
          >
            {placeholder}
          </div>
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${
                opt.value === value
                  ? "text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-500/10 font-medium"
                  : "text-slate-800 dark:text-slate-200"
              }`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              <span className="text-base shrink-0 leading-none">{opt.icon || "🏦"}</span>
              <span className="flex-1 truncate">{opt.name}</span>
              {opt.balance !== undefined && (
                <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                  {opt.balance.toLocaleString()}đ
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {required && (
        <input
          tabIndex={-1}
          required
          value={value || ""}
          onChange={() => {}}
          className="absolute inset-0 opacity-0 pointer-events-none"
        />
      )}
    </div>
  );
};

const buildInitialFormData = (fields, extractedFields, suggestedValues) => {
  const merged = { ...suggestedValues, ...extractedFields };
  const initialData = {};

  fields.forEach((field) => {
    const rawValue = merged[field.key] !== undefined ? merged[field.key] : "";
    if (field.type === "date") {
      initialData[field.key] = normalizeToIsoDate(rawValue) || rawValue;
      return;
    }

    if (field.type === "number") {
      initialData[field.key] = rawValue !== "" ? normalizeAmountInput(rawValue) : "";
      return;
    }

    initialData[field.key] = rawValue;
  });

  return initialData;
};

const AIConfirmationForm = ({ intent, extractedFields, suggestedValues, confirmationPrompt, onConfirm, onCancel, isProcessing }) => {
  const [categoriesByType, setCategoriesByType] = useState({});
  const [jars, setJars] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingJars, setLoadingJars] = useState(false);
  const fields = useMemo(() => getFieldsForIntent(intent), [intent]);
  const [formData, setFormData] = useState(() => buildInitialFormData(fields, extractedFields, suggestedValues));

  useEffect(() => {
    const categoryTypes = [...new Set(
      fields
        .filter((f) => f.type === "category_select" && f.categoryType)
        .map((f) => f.categoryType)
    )];

    if (categoryTypes.length > 0) {
      const loadCategories = async () => {
        setLoadingCategories(true);
        try {
          const responses = await Promise.all(
            categoryTypes.map((catType) =>
              axiosConfig.get(API_ENDPOINTS.CATEGORY_BY_TYPE(catType))
                .then((res) => [catType, res.data])
                .catch(() => [catType, []])
            )
          );
          setCategoriesByType((prev) => ({
            ...prev,
            ...Object.fromEntries(responses),
          }));
        } finally {
          setLoadingCategories(false);
        }
      };

      void loadCategories();
    }

    const hasJarSelect = fields.some((f) => f.type === "jar_select");
    if (hasJarSelect) {
      const loadJars = async () => {
        setLoadingJars(true);
        try {
          const res = await axiosConfig.get(API_ENDPOINTS.GET_JARS);
          setJars(res.data || []);
        } catch {
          setJars([]);
        } finally {
          setLoadingJars(false);
        }
      };

      void loadJars();
    }
  }, [fields]);

  const handleFieldChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const mergedData = { ...suggestedValues, ...extractedFields, ...formData };
    const normalizedData = {};

    for (const [key, value] of Object.entries(mergedData)) {
      const fieldDefinition = fields.find((field) => field.key === key);
      normalizedData[key] = fieldDefinition?.type === "number"
        ? normalizeAmountInput(value)
        : value;
    }

    onConfirm(intent, normalizedData);
  };

  const intentIcon = INTENT_ICONS[intent] || "🤖";
  const intentLabel = INTENT_LABELS[intent] || intent;

  return (
    <div className="relative overflow-visible rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/75 dark:bg-slate-900/60 backdrop-blur-md p-5 my-2 shadow-[0_8px_32px_rgba(139,92,246,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)] transition-all duration-300">
      {/* Subtle premium violet border strip */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-violet-500 to-indigo-500 dark:from-violet-600 dark:to-indigo-600 opacity-60" />

      {/* Header section with specialized badge */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3 mb-4 mt-0.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 dark:from-violet-500/20 dark:to-indigo-500/20 flex items-center justify-center border border-violet-200/50 dark:border-violet-500/30 shadow-[0_4px_12px_rgba(139,92,246,0.04)]">
            <span className="text-xl animate-pulse">{intentIcon}</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/15 px-1.5 py-0.5 rounded">AI Trợ Lý</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Giao dịch đề xuất</span>
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{intentLabel}</h4>
          </div>
        </div>
      </div>

      {/* Sparkles / Info banner */}
      {confirmationPrompt && (
        <div className="flex items-start gap-2.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 p-3.5 mb-4 text-xs text-slate-600 dark:text-slate-300">
          <Lucide.Sparkles size={14} className="text-violet-500 dark:text-violet-400 shrink-0 mt-0.5 animate-bounce" />
          <p className="leading-relaxed">{confirmationPrompt}</p>
        </div>
      )}

      {/* Grid-based dynamic form layout */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {fields.map((field) => {
            const isFullWidth = field.key === "description" || field.key === "name" || field.key === "fullName" || field.key === "title";
            return (
              <div key={field.key} className={`flex flex-col gap-1.5 ${isFullWidth ? "sm:col-span-2" : ""}`}>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === "category_select" ? (
                  <CategorySelect
                    value={formData[field.key] || ""}
                    onChange={(val) => handleFieldChange(field.key, val)}
                    options={(categoriesByType[field.categoryType] || []).map((cat) => ({
                      value: cat.name,
                      name: cat.name,
                      icon: cat.icon,
                    }))}
                    required={field.required}
                    disabled={isProcessing || loadingCategories}
                    placeholder={loadingCategories ? "Đang tải danh mục..." : undefined}
                  />
                ) : field.type === "jar_select" ? (
                  <JarSelect
                    value={formData[field.key] || ""}
                    onChange={(val) => handleFieldChange(field.key, val)}
                    options={jars.map((jar) => ({
                      value: jar.name,
                      name: jar.name,
                      icon: jar.icon,
                      balance: jar.currentBalance,
                    }))}
                    required={field.required}
                    disabled={isProcessing || loadingJars}
                    placeholder={loadingJars ? "Đang tải hũ..." : undefined}
                  />
                ) : field.type === "date" ? (
                  <DateInput
                    value={formData[field.key] || ""}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none transition-all duration-200 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-1 focus:ring-violet-500/20 dark:focus:ring-violet-500/20"
                    required={field.required}
                  />
                ) : (
                  <input
                    type="text"
                    inputMode={field.type === "number" ? "decimal" : undefined}
                    value={formData[field.key] || ""}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={field.label}
                    required={field.required}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none transition-all duration-200 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-1 focus:ring-violet-500/20 dark:focus:ring-violet-500/20"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Action buttons with modern gradients */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/5 mt-5">
          <button
            type="submit"
            disabled={isProcessing}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white px-5 py-2.5 text-sm font-semibold transition-all duration-150 shadow-[0_4px_12px_rgba(16,185,129,0.15)] hover:shadow-[0_4px_16px_rgba(16,185,129,0.25)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isProcessing ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Check size={16} />
            )}
            Xác nhận
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white hover:bg-slate-50 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 active:scale-95 text-slate-700 dark:text-slate-300 px-5 py-2.5 text-sm font-semibold transition-all duration-150 shadow-sm cursor-pointer"
          >
            <X size={16} />
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIConfirmationForm;

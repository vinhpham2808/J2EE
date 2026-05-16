import { useState, useEffect } from "react";
import { Check, Edit3, X } from "lucide-react";
import { getFieldsForIntent, INTENT_ICONS, INTENT_LABELS } from "../util/aiIntentParser.js";

const AIConfirmationForm = ({ intent, extractedFields, suggestedValues, confirmationPrompt, onConfirm, onCancel, isProcessing }) => {
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fieldDefs = getFieldsForIntent(intent);
    const merged = { ...suggestedValues, ...extractedFields };
    setFields(fieldDefs);
    const initialData = {};
    fieldDefs.forEach((f) => {
      initialData[f.key] = merged[f.key] !== undefined ? merged[f.key] : "";
    });
    setFormData(initialData);
  }, [intent, extractedFields, suggestedValues]);

  const handleFieldChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Merge extractedFields so DELETE intents always carry their IDs (incomeId, expenseId, etc.)
    onConfirm(intent, { ...suggestedValues, ...extractedFields, ...formData });
  };

  const intentIcon = INTENT_ICONS[intent] || "🤖";
  const intentLabel = INTENT_LABELS[intent] || intent;

  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 my-2">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{intentIcon}</span>
        <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">{intentLabel}</span>
      </div>

      {confirmationPrompt && (
        <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">{confirmationPrompt}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {fields.map((field) => (
          <div key={field.key} className="flex flex-col gap-1">
            <label className="text-xs font-medium text-amber-700 dark:text-amber-400">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {field.type === "date" ? (
              <input
                type="date"
                value={formData[field.key] || ""}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                required={field.required}
                className="w-full rounded-xl border border-amber-200 dark:border-amber-500/30 bg-white dark:bg-white/10 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-amber-400 dark:focus:border-amber-500"
              />
            ) : (
              <input
                type={field.type === "number" ? "number" : "text"}
                value={formData[field.key] || ""}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                placeholder={field.label}
                required={field.required}
                min={field.type === "number" ? "0" : undefined}
                step={field.type === "number" ? "any" : undefined}
                className="w-full rounded-xl border border-amber-200 dark:border-amber-500/30 bg-white dark:bg-white/10 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-amber-400 dark:focus:border-amber-500"
              />
            )}
          </div>
        ))}

        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
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

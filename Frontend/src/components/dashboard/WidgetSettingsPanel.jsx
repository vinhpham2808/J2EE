import { X, RotateCcw, GripVertical } from "lucide-react";
import { WIDGET_REGISTRY } from "./widgetRegistry";
import toast from "react-hot-toast";

const WidgetSettingsPanel = ({
  isOpen,
  onClose,
  widgetConfig,
  sortedWidgetIds,
  onToggle,
  onReset,
}) => {
  const handleReset = () => {
    onReset();
    toast.success("Đã đặt lại bố cục mặc định");
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl z-50 
          border-l border-slate-200 dark:border-white/10
          transform transition-transform duration-300 ease-in-out overflow-y-auto
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 z-10">
          <div className="flex items-center justify-between p-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Tùy chỉnh Dashboard
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Reset button */}
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
              bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300
              hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition"
          >
            <RotateCcw size={16} />
            Đặt lại mặc định
          </button>

          {/* Pinned section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              Ghim cố định
            </h3>
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/3 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
                    {(() => {
                      const reg = WIDGET_REGISTRY.ai_assistant;
                      const Icon = reg?.icon;
                      return Icon ? (
                        <Icon size={16} className="text-violet-600 dark:text-violet-400" />
                      ) : null;
                    })()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {WIDGET_REGISTRY.ai_assistant?.label}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {WIDGET_REGISTRY.ai_assistant?.description}
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={widgetConfig.ai_assistant?.visible ?? true}
                  onChange={() => onToggle("ai_assistant")}
                />
              </div>
            </div>
          </div>

          {/* Sortable & Visible section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              Sắp xếp &amp; Hiển thị
            </h3>
            <div className="space-y-2">
              {sortedWidgetIds.map((widgetId) => {
                const reg = WIDGET_REGISTRY[widgetId];
                const Icon = reg?.icon;
                const config = widgetConfig[widgetId];
                return (
                  <div
                    key={widgetId}
                    className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 
                      bg-white dark:bg-white/3 p-3.5 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Drag icon indicator */}
                      <div className="text-slate-300 dark:text-slate-600 shrink-0">
                        <GripVertical size={16} />
                      </div>
                      {/* Icon */}
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                        {Icon ? (
                          <Icon size={16} className="text-slate-600 dark:text-slate-400" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {reg?.label || widgetId}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {reg?.description || ""}
                        </p>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={config?.visible ?? true}
                      onChange={() => onToggle(widgetId)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer hint */}
          <p className="text-[11px] text-slate-400 text-center">
            Kéo thả biểu tượng ✧ để sắp xếp lại thứ tự widget
          </p>
        </div>
      </div>
    </>
  );
};

// Pure Tailwind Toggle Switch component
const ToggleSwitch = ({ checked, onChange }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
        transition-colors duration-200 ease-in-out focus:outline-none
        ${checked
          ? "bg-amber-500"
          : "bg-slate-200 dark:bg-white/10"
        }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 
          transition duration-200 ease-in-out
          ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
};

export default WidgetSettingsPanel;

import { X } from "lucide-react";

const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-center items-center bg-slate-950/40 backdrop-blur-sm animate-modal-backdrop"
      onClick={onClose}
    >
      <div 
        className="relative p-4 w-full max-w-2xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative rounded-2xl shadow-2xl overflow-hidden animate-modal-content
          bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-white/10 pt-[3px]">
          
          {/* Top Gradient Highlight */}
          <div className="h-[3px] w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-amber-500 absolute top-0 left-0" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30">
            <h3 className="text-[18px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 cursor-pointer
                text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:rotate-90
                bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6.5 text-[15.5px] leading-relaxed text-slate-600 dark:text-slate-350 overflow-y-auto max-h-[calc(90vh-90px)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;


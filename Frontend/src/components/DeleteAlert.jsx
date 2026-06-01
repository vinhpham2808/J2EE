import { useState } from "react";
import { LoaderCircle, Trash2, AlertTriangle } from "lucide-react";

const DeleteAlert = ({ content, onDelete, onCancel }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-5">
      {/* Visual Indicator with Pulsing Halo */}
      <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 shrink-0 mx-auto md:mx-0">
        <span className="absolute inset-0 rounded-full bg-rose-500/15 animate-halo-pulse" />
        <AlertTriangle className="text-rose-500 z-10" size={24} />
      </div>

      <div className="flex-1 text-center md:text-left">
        <p className="text-[15px] text-slate-600 dark:text-slate-455 leading-relaxed whitespace-pre-line">
          {content}
        </p>
        
        {/* Actions Row */}
        <div className="flex justify-center md:justify-end gap-3 mt-6">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={loading}
              type="button"
              className="px-5 py-2.5 rounded-xl text-[14px] font-semibold transition duration-150 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer
                bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300"
            >
              Hủy
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={loading}
            type="button"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold cursor-pointer
              bg-rose-600 hover:bg-rose-500 text-white transition duration-150 transform-gpu active:scale-95
              disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-rose-600/10 hover:shadow-rose-600/20"
          >
            {loading ? (
              <>
                <LoaderCircle size={16} className="animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Xóa
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAlert;


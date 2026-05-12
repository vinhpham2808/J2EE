import { useState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";

const DeleteAlert = ({ content, onDelete }) => {
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
    <div>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{content}</p>
      <div className="flex justify-end mt-6">
        <button
          onClick={handleDelete}
          disabled={loading}
          type="button"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
            bg-red-600 hover:bg-red-500 text-white transition-all duration-150 active:scale-95
            disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <LoaderCircle size={15} className="animate-spin" />
              Đang xóa...
            </>
          ) : (
            <>
              <Trash2 size={15} />
              Xóa
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DeleteAlert;

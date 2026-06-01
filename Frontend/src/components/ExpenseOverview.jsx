import { CircleHelp, ImageUp, LoaderCircle, Plus } from "lucide-react";

const ExpenseOverview = ({ onExpenseIncome, onImportReceipt, isImportingReceipt = false, onOpenFormatInfo }) => {
  return (
    <div className="card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h5 className="text-base font-bold text-slate-900 dark:text-white">Tổng quan chi tiêu</h5>
            {onOpenFormatInfo && (
              <button
                type="button"
                onClick={onOpenFormatInfo}
                className="rounded-xl p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0"
                title="Xem định dạng hỗ trợ"
              >
                <CircleHelp size={15} />
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Theo dõi chi tiêu và thêm nhanh các giao dịch trong tháng.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
          <button
            className="add-btn disabled:opacity-60 disabled:cursor-not-allowed bg-slate-700 hover:bg-slate-600 w-full sm:w-auto justify-center"
            onClick={onImportReceipt}
            disabled={!onImportReceipt || isImportingReceipt}
            type="button"
          >
            {isImportingReceipt ? (
              <><LoaderCircle size={15} className="animate-spin" />Đang quét hóa đơn...</>
            ) : (
              <><ImageUp size={15} />Kiểm tra hóa đơn</>
            )}
          </button>
          <button className="add-btn w-full sm:w-auto justify-center" onClick={onExpenseIncome}>
            <Plus size={15} />Thêm chi tiêu
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseOverview;

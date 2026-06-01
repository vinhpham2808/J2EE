import { Plus } from "lucide-react";

const IncomeOverview = ({ onAddIncome }) => {
  return (
    <div className="card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h5 className="text-base font-bold text-slate-900 dark:text-white">Tổng quan thu nhập</h5>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Theo dõi và thêm nhanh các khoản thu nhập của bạn.
          </p>
        </div>
        <button className="add-btn w-full sm:w-auto justify-center" onClick={onAddIncome}>
          <Plus size={15} />Thêm thu nhập
        </button>
      </div>
    </div>
  );
};

export default IncomeOverview;

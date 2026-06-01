import BudgetCard from "./BudgetCard.jsx";

/**
 * BudgetList – Danh sách hạn mức ngân sách
 * Props:
 *   budgets     – mảng budget objects
 *   onDelete    – callback(id)
 *   onAddClick  – callback khi ấn nút Thêm hạn mức mới
 *   loading     – boolean
 */
const BudgetList = ({ budgets = [], onDelete, onAddClick, loading = false }) => {
    if (loading) {
        return (
            <div className="budget-list">
                <div className="budget-list__header">
                    <div className="space-y-2">
                        <div className="h-6 w-48 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse" />
                        <div className="h-4 w-24 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                    </div>
                    <div className="h-10 w-36 bg-slate-200 dark:bg-white/10 rounded-xl animate-pulse" />
                </div>
                <div className="budget-list__grid">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 space-y-4 animate-pulse">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/10" />
                                    <div className="space-y-2">
                                        <div className="h-4 w-28 bg-slate-200 dark:bg-white/10 rounded" />
                                        <div className="h-3 w-16 bg-slate-200 dark:bg-white/10 rounded" />
                                    </div>
                                </div>
                                <div className="w-7 h-7 bg-slate-200 dark:bg-white/10 rounded-lg" />
                            </div>
                            <div className="h-2.5 w-full bg-slate-200/50 dark:bg-white/5 rounded-full" />
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <div className="h-3 w-12 bg-slate-200 dark:bg-white/10 rounded" />
                                    <div className="h-4 w-20 bg-slate-200 dark:bg-white/10 rounded" />
                                </div>
                                <div className="h-5 w-14 bg-slate-200 dark:bg-white/10 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="budget-list">
            <div className="budget-list__header">
                <div>
                    <h2 className="budget-list__title">Hạn mức ngân sách</h2>
                    <p className="budget-list__subtitle">
                        Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
                    </p>
                </div>
                <button
                    className="add-btn add-btn-fill"
                    onClick={onAddClick}
                    id="budget-add-btn"
                >
                    + Thêm hạn mức
                </button>
            </div>

            {budgets.length === 0 ? (
                <div className="budget-list__empty">
                    <span className="budget-list__empty-icon">💸</span>
                    <p>Chưa có hạn mức nào trong tháng này</p>
                    <p className="budget-list__empty-hint">
                        Nhấn <strong>+ Thêm hạn mức</strong> để bắt đầu quản lý ngân sách
                    </p>
                </div>
            ) : (
                <div className="budget-list__grid">
                    {budgets.map((budget) => (
                        <BudgetCard
                            key={budget.id}
                            budget={budget}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default BudgetList;

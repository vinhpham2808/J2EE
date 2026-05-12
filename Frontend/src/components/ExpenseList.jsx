import moment from "moment";
import { Download, LoaderCircle, Mail, FileSpreadsheet, Lock } from "lucide-react";
import { useState } from "react";
import TransactionInfoCard from "./TransactionInfoCard.jsx";

const ExpenseList = ({
    transactions,
    onDelete,
    onDownload,
    onEmail,
    disableExportActions = false,
    disabledMessage = "",
}) => {
    const [loadingAction, setLoadingAction] = useState(null);
    const isBusy = loadingAction !== null;

    const handleAction = async (action, callback) => {
        if (disableExportActions || !callback) return;
        setLoadingAction(action);
        try {
            await callback();
        } finally {
            setLoadingAction(null);
        }
    };

    return (
        <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
                <div>
                    <h5 className="text-lg font-semibold text-slate-900 dark:text-white">Tất cả chi tiêu</h5>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {transactions?.length ?? 0} giao dịch
                    </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                        {/* Email button */}
                        <button
                            disabled={isBusy || disableExportActions}
                            onClick={() => handleAction("email", onEmail)}
                            title={disableExportActions ? disabledMessage : "Gửi báo cáo qua email (lưu S3)"}
                            type="button"
                            className={[
                                "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all",
                                "border border-slate-200 dark:border-white/10",
                                "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300",
                                "hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20",
                                "active:scale-95 shadow-sm",
                                (isBusy || disableExportActions) ? "opacity-50 cursor-not-allowed" : "",
                            ].join(" ")}
                        >
                            {loadingAction === "email" ? (
                                <><LoaderCircle size={14} className="animate-spin" />Đang gửi...</>
                            ) : disableExportActions ? (
                                <><Lock size={14} />Gửi Email</>
                            ) : (
                                <><Mail size={14} />Gửi Email</>
                            )}
                        </button>

                        {/* Download button */}
                        <button
                            disabled={isBusy || disableExportActions}
                            onClick={() => handleAction("download", onDownload)}
                            title={disableExportActions ? disabledMessage : "Tải file Excel về máy"}
                            type="button"
                            className={[
                                "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all",
                                "shadow-sm active:scale-95",
                                disableExportActions
                                    ? "border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-400 dark:text-slate-500 opacity-50 cursor-not-allowed"
                                    : "border border-violet-500/30 bg-violet-600 hover:bg-violet-500 text-white",
                            ].join(" ")}
                        >
                            {loadingAction === "download" ? (
                                <><LoaderCircle size={14} className="animate-spin" />Đang tải...</>
                            ) : disableExportActions ? (
                                <><Lock size={14} />Xuất Excel</>
                            ) : (
                                <><FileSpreadsheet size={14} />Xuất Excel</>
                            )}
                        </button>
                    </div>

                    {disableExportActions && disabledMessage && (
                        <p className="max-w-xs text-right text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Lock size={11} />
                            {disabledMessage}
                        </p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 mt-4">
                {transactions?.map((expense) => (
                    <TransactionInfoCard
                        key={expense.id}
                        title={expense.name}
                        icon={expense.icon}
                        category={expense.categoryName}
                        receiptLocation={expense.receiptLocation}
                        date={moment(expense.date).format("DD/MM/YYYY")}
                        amount={expense.amount}
                        type="expense"
                        onDelete={() => onDelete(expense.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default ExpenseList;

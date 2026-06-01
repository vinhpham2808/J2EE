import { LoaderCircle, Mail, FileSpreadsheet, Lock } from "lucide-react";
import TransactionInfoCard from "./TransactionInfoCard.jsx";
import moment from "moment";
import { useState } from "react";

const IncomeList = ({
    transactions,
    onDelete,
    onEdit,
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
            <div className="mb-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h5 className="text-lg font-semibold text-slate-900 dark:text-white">Nguồn thu nhập</h5>
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                        {transactions?.length ?? 0} giao dịch
                    </p>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <button
                            disabled={isBusy || disableExportActions}
                            onClick={() => handleAction("email", onEmail)}
                            title={disableExportActions ? disabledMessage : "Gửi báo cáo qua email"}
                            type="button"
                            className={[
                                "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm transition dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
                                "hover:bg-slate-50 hover:border-slate-300 dark:hover:bg-white/10 dark:hover:border-white/20 active:scale-95",
                                (isBusy || disableExportActions) ? "cursor-not-allowed opacity-50" : "",
                            ].join(" ")}
                        >
                            {loadingAction === "email" ? (
                                <><LoaderCircle size={14} className="animate-spin" />Đang gửi...</>
                            ) : disableExportActions ? (
                                <><Lock size={14} />Gửi email</>
                            ) : (
                                <><Mail size={14} />Gửi email</>
                            )}
                        </button>

                        <button
                            disabled={isBusy || disableExportActions}
                            onClick={() => handleAction("download", onDownload)}
                            title={disableExportActions ? disabledMessage : "Tải file Excel về máy"}
                            type="button"
                            className={[
                                "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition shadow-sm active:scale-95",
                                disableExportActions
                                    ? "cursor-not-allowed border border-slate-200 bg-white text-slate-400 opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
                                    : "border border-emerald-500/30 bg-emerald-500 text-white hover:bg-emerald-400",
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

                    {disableExportActions && disabledMessage ? (
                        <p className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 sm:max-w-xs sm:text-right">
                            <Lock size={11} />
                            {disabledMessage}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-2">
                {transactions?.map((income) => (
                    <TransactionInfoCard
                        key={income.id}
                        title={income.name}
                        icon={income.icon}
                        date={moment(income.date).format("DD/MM/YYYY")}
                        amount={income.amount}
                        type="income"
                        onDelete={() => onDelete(income.id)}
                        onEdit={() => onEdit(income)}
                    />
                ))}
            </div>
        </div>
    );
};

export default IncomeList;

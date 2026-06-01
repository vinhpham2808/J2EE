import { Trash2, TrendingDown, TrendingUp, Pencil } from "lucide-react";
import * as Lucide from "lucide-react";
import { addThousandsSeparator } from "../util/util.js";
import { hasDisplayImage, hideBrokenImageWrapper } from "../util/imageDisplay.js";
import { formatDateForDisplay } from "../util/dateInput.js";

const TransactionInfoCard = ({
    icon,
    title,
    date,
    amount,
    type,
    hideDeleteBtn,
    onDelete,
    onEdit,
    onSelect,
    isSelected = false,
    category,
    receiptLocation,
}) => {
    const amountClass = type === "income"
        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400";

    const containerClassName = [
        "group relative mt-2 rounded-2xl border p-3 sm:p-4 transition-all duration-200",
        onSelect ? "cursor-pointer" : "",
        isSelected 
            ? "border-violet-500 dark:border-amber-500 bg-violet-50/50 dark:bg-amber-500/10 shadow-[0_0_12px_rgba(139,92,246,0.15)] dark:shadow-[0_0_12px_rgba(245,158,11,0.15)]" 
            : "border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.06]",
    ].join(" ");

    const handleCardClick = () => {
        onSelect?.();
    };

    const handleButtonClick = (event, callback) => {
        event.stopPropagation();
        callback?.();
    };

    const resolvedDate = formatDateForDisplay(date) || date;

    const renderCardIcon = () => {
        if (!icon) {
            return <span className="text-sm sm:text-base leading-none">💰</span>;
        }
        if (hasDisplayImage(icon) && !receiptLocation) {
            return (
                <img
                    src={icon}
                    alt={title}
                    className="h-6 w-6 object-contain rounded-md"
                    onError={hideBrokenImageWrapper}
                />
            );
        }
        const LucideIcon = Lucide[icon];
        if (LucideIcon) {
            return <LucideIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />;
        }
        return <span className="text-sm sm:text-base leading-none shrink-0">{icon}</span>;
    };

    return (
        <div
            className={containerClassName}
            onClick={handleCardClick}
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect ? 0 : undefined}
            onKeyDown={onSelect ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleCardClick();
                }
            } : undefined}
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-start gap-3 sm:flex-1">
                    <div
                        data-image-wrapper="true"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-350 sm:h-12 sm:w-12 shadow-sm"
                    >
                        {renderCardIcon()}
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{title}</p>
                        <p className="mt-1 text-xs text-slate-400">
                            {category ? <span className="text-slate-500 dark:text-slate-400">{category} • </span> : null}
                            {resolvedDate}
                        </p>
                        {receiptLocation ? (
                            <p className="mt-1 truncate text-xs text-sky-600 dark:text-sky-400">
                                Hóa đơn{receiptLocation ? ` • ${receiptLocation}` : ""}
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                    {!hideDeleteBtn ? (
                        <div className="flex items-center gap-1.5 absolute top-3 right-3 sm:relative sm:top-auto sm:right-auto z-10">
                            {onEdit ? (
                                <button
                                    onClick={(event) => handleButtonClick(event, onEdit)}
                                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-violet-600 dark:hover:bg-white/10 dark:hover:text-amber-500"
                                >
                                    <Pencil size={18} />
                                </button>
                            ) : null}
                            <button
                                onClick={(event) => handleButtonClick(event, onDelete)}
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ) : null}

                    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${amountClass}`}>
                        <h6 className="text-xs font-semibold sm:text-sm">
                            {type === "income" ? "+ " : "- "}{addThousandsSeparator(amount)}đ
                        </h6>
                        {type === "income" ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionInfoCard;

import {Trash2, TrendingDown, TrendingUp} from "lucide-react";
import {addThousandsSeparator} from "../util/util.js";
import {hasDisplayImage, hideBrokenImageWrapper} from "../util/imageDisplay.js";

const TransactionInfoCard = ({icon, title, date, amount, type, hideDeleteBtn, onDelete, category, receiptLocation}) => {
    const shouldShowImage = hasDisplayImage(icon) && !receiptLocation;

    const amountClass = type === 'income'
        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
        : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400';

    return (
        <div className="group relative flex items-center gap-4 mt-2 p-3 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/5 transition-colors">
            {shouldShowImage ? (
                <div
                    data-image-wrapper="true"
                    className="w-12 h-12 flex shrink-0 items-center justify-center text-xl text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/10 rounded-full"
                >
                    <img
                        src={icon}
                        alt={title}
                        className="w-6 h-6 object-contain"
                        onError={hideBrokenImageWrapper}
                    />
                </div>
            ) : null}

            <div className="flex-1 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{title}</p>
                    <p className="text-xs text-slate-400 mt-1">
                        {category && <span className="text-slate-500 dark:text-slate-400">{category} • </span>}
                        {date}
                    </p>
                    {receiptLocation ? (
                        <p className="text-xs text-sky-600 dark:text-sky-400 mt-1">Hóa đơn</p>
                    ) : null}
                </div>

                <div className="flex items-center gap-2">
                    {!hideDeleteBtn && (
                        <button
                            onClick={onDelete}
                            className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}

                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${amountClass}`}>
                        <h6 className="text-xs font-medium">
                            {type === 'income' ? '+ ' : '- '}{addThousandsSeparator(amount)} VND
                        </h6>
                        {type === 'income' ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionInfoCard;

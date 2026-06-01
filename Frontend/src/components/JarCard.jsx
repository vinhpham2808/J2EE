import { useState } from "react";
import { Pencil, Trash2, TrendingUp, TrendingDown, Vault, Plus, ArrowLeftRight } from "lucide-react";
import { hasDisplayImage } from "../util/imageDisplay.js";

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n ?? 0);

const JarCard = ({ jar, totalBalance, onEdit, onDelete, onClick, onAddExpenseClick, onTransferClick }) => {
  const { name, icon, color, targetPercentage, currentBalance } = jar;
  const [hovered, setHovered] = useState(false);

  const actualPercent = totalBalance > 0
    ? ((currentBalance / totalBalance) * 100).toFixed(1)
    : "0.0";

  const isNegative = currentBalance < 0;

  const progressWidth = Math.min(
    Math.abs(currentBalance) / (totalBalance > 0 ? totalBalance : 1) * 100,
    100
  );

  return (
    <div 
      className="card relative overflow-hidden group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5" 
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderColor: hovered ? (color || "#8B5CF6") : undefined
      }}
    >


      {/* Color accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ backgroundColor: color || "#8B5CF6" }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mt-1 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border border-white/20 dark:border-white/5"
            style={{ backgroundColor: `${color || "#8B5CF6"}18` }}
          >
            {icon ? (
              hasDisplayImage(icon) ? (
                <img src={icon} alt={name} className="w-6 h-6 object-contain" />
              ) : (
                <span className="text-xl select-none">{icon}</span>
              )
            ) : (
              <Vault size={20} style={{ color: color || "#8B5CF6" }} />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white truncate tracking-tight">{name}</h3>
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              Mục tiêu: <span className="text-amber-500">{targetPercentage ?? 0}%</span>
            </p>
          </div>
        </div>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isNegative ? "text-rose-500" : "text-slate-800 dark:text-white"}`}>
          {fmt(currentBalance)}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[11px] font-medium mb-1">
          <span className="text-slate-450 dark:text-slate-400">Tỷ trọng thực tế</span>
          <span className="font-bold" style={{ color: color || "#8B5CF6" }}>
            {actualPercent}% / {targetPercentage ?? 0}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800/40 rounded-full overflow-hidden shadow-inner border border-slate-200/10 dark:border-white/5 relative">
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out relative"
            style={{
              width: `${progressWidth}%`,
              backgroundColor: isNegative ? "#EF4444" : (color || "#8B5CF6"),
              boxShadow: isNegative ? '0 0 8px rgba(239, 68, 68, 0.4)' : `0 0 8px ${(color || '#8B5CF6')}40`,
            }}
          >
            
          </div>
        </div>
      </div>

      {/* Footer row: Status tag (left) + Action buttons group (right) */}
      <div className="flex items-center justify-between border-t border-slate-100/60 dark:border-white/5 pt-3.5 mt-1 shrink-0">
        <div>
          {parseFloat(actualPercent) >= (targetPercentage ?? 0) ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/20 dark:border-emerald-500/10">
              <TrendingUp size={10} /> Đạt mục tiêu
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/20 dark:border-amber-500/10">
              <TrendingDown size={10} /> Dưới mục tiêu
            </span>
          )}
        </div>

        {/* Quick Actions Row */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onAddExpenseClick(); }}
            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-450 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors border border-transparent hover:border-emerald-200/30"
            title="Thêm chi tiêu nhanh"
          >
            <Plus size={14} />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); onTransferClick(); }}
            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors border border-transparent hover:border-blue-200/30"
            title="Chuyển tiền nhanh"
          >
            <ArrowLeftRight size={14} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 text-slate-400 hover:text-violet-650 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-lg transition-colors border border-transparent hover:border-violet-200/30"
            title="Chỉnh sửa hũ"
          >
            <Pencil size={13} />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-200/30"
            title="Xoá hũ"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default JarCard;

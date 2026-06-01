import { useState } from "react";
import moment from "moment";
import { ChevronLeft, ChevronRight, Calendar, Tag, Hash, FileText } from "lucide-react";
import * as Lucide from "lucide-react";
import { hasDisplayImage } from "../util/imageDisplay.js";
import TransactionInfoCard from "./TransactionInfoCard.jsx";
import { addThousandsSeparator } from "../util/util.js";
import {
  buildCalendarDays,
  buildTransactionDayMap,
  calculateMonthTotals,
  formatCompactTransactionAmount,
  getDefaultSelectedDate,
  normalizeTransactionMoment,
} from "../util/transactionCalendar.js";

const dayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const renderTransactionIcon = (iconVal) => {
  if (!iconVal) return "💰";
  if (hasDisplayImage(iconVal)) {
    return (
      <img
        src={iconVal}
        alt="icon"
        className="w-7 h-7 object-contain rounded-lg"
      />
    );
  }
  const LucideIcon = Lucide[iconVal];
  if (LucideIcon) {
    return <LucideIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />;
  }
  return <span className="inline-block text-lg shrink-0 leading-none">{iconVal}</span>;
};

const TransactionCalendar = ({
  transactions = [],
  type = "both",
  onEdit,
  onDelete,
  initialMonth,
  onSelectDate,
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (initialMonth) {
      const normalizedInitialMonth = moment(initialMonth, ["YYYY-MM", "YYYY-MM-DD"], true);
      if (normalizedInitialMonth.isValid()) {
        return normalizedInitialMonth.startOf("month");
      }
    }

    return moment().startOf("month");
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);

  const dayMap = buildTransactionDayMap(transactions, type);
  const calendarDays = buildCalendarDays(currentMonth);
  const monthTotals = calculateMonthTotals(transactions, currentMonth, type);
  const defaultSelectedDate = getDefaultSelectedDate(currentMonth, dayMap);
  const effectiveSelectedDate = (
    selectedDate &&
    moment(selectedDate, "YYYY-MM-DD", true).isValid() &&
    moment(selectedDate, "YYYY-MM-DD", true).isSame(currentMonth, "month")
  )
    ? selectedDate
    : defaultSelectedDate;
  const selectedDayEntry = effectiveSelectedDate ? dayMap.get(effectiveSelectedDate) : null;
  const selectedDayTransactions = selectedDayEntry?.transactions ?? [];
  const selectedDayTotals = selectedDayEntry?.totals ?? { income: 0, expense: 0 };
  const selectedDayMoment = effectiveSelectedDate
    ? moment(effectiveSelectedDate, "YYYY-MM-DD", true)
    : null;
  const activeTransaction = selectedDayTransactions.find(
    (transaction) => transaction.id === selectedTransactionId,
  ) ?? selectedDayTransactions[0] ?? null;

  const handleSelectDay = (day) => {
    if (day.date.isAfter(moment(), "day")) {
      return;
    }
    if (!day.isCurrentMonth) {
      setCurrentMonth(day.date.clone().startOf("month"));
    }

    setSelectedDate(day.dateKey);
    setSelectedTransactionId(null);
    if (onSelectDate) {
      onSelectDate(day.dateKey);
    }
  };

  const renderDayAmount = (amount, amountType) => {
    if (amount <= 0) return null;
    if (type === "income" && amountType === "expense") return null;
    if (type === "expense" && amountType === "income") return null;

    const amountClass = amountType === "income"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-500 dark:text-red-400";

    return (
      <p key={amountType} className={`truncate text-[10px] font-semibold leading-4 sm:text-[11px] ${amountClass}`}>
        {formatCompactTransactionAmount(amount, amountType)}
      </p>
    );
  };

  const renderSummaryValue = (amount, amountType) => {
    const amountClass = amountType === "income"
      ? "text-emerald-600 dark:text-emerald-400"
      : amountType === "expense"
        ? "text-red-500 dark:text-red-400"
        : amount >= 0
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-500 dark:text-red-400";
    const prefix = amountType === "income" ? "+ " : amountType === "expense" ? "- " : "";

    return (
      <p className={`mt-2 text-base font-bold sm:text-lg ${amountClass}`}>
        {prefix}{addThousandsSeparator(Math.abs(amount))}đ
      </p>
    );
  };

  return (
    <div className="card">
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h5 className="text-base font-bold text-slate-900 dark:text-white">Lịch giao dịch</h5>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              Xem nhanh tổng thu chi theo từng ngày và mở chi tiết khi cần.
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => setCurrentMonth((previousMonth) => previousMonth.clone().subtract(1, "month"))}
              className="rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
              aria-label="Tháng trước"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="min-w-[132px] text-center text-sm font-semibold text-slate-800 dark:text-slate-100 sm:min-w-[150px]">
              {`Tháng ${currentMonth.format("MM/YYYY")}`}
            </div>
            <button
              type="button"
              onClick={() => setCurrentMonth((previousMonth) => previousMonth.clone().add(1, "month"))}
              className="rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
              aria-label="Tháng sau"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/[0.03] overflow-hidden">
          <div className="w-full">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]">
              {dayLabels.map((label) => (
                <div
                  key={label}
                  className="px-1.5 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:px-2 sm:py-3 sm:text-xs"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day) => {
                const dayEntry = dayMap.get(day.dateKey);
                const isSelected = effectiveSelectedDate === day.dateKey;
                const hasTransactions = Boolean(dayEntry?.transactions.length);
                const isFuture = day.date.isAfter(moment(), "day");

                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    disabled={isFuture}
                    className={[
                      "min-h-[74px] border-r border-b border-slate-200 p-1.5 text-left transition-colors dark:border-white/10 sm:min-h-[92px] sm:p-2",
                      isFuture ? "opacity-30 cursor-not-allowed bg-slate-100/50 dark:bg-white/[0.01]" : "hover:bg-slate-50 dark:hover:bg-white/[0.06]",
                      day.isCurrentMonth && !isFuture ? "bg-white dark:bg-transparent" : "bg-slate-50/70 dark:bg-white/[0.02]",
                      day.isToday && !isSelected ? "bg-violet-500/[0.03] ring-1 ring-inset ring-violet-500/15 dark:bg-amber-500/[0.03] dark:ring-amber-400/10" : "",
                      isSelected ? "bg-violet-50 ring-1 ring-inset ring-violet-400 dark:bg-amber-500/10 dark:ring-amber-400" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span
                        className={[
                          "flex items-center justify-center text-xs font-bold sm:text-sm rounded-full transition-all duration-200 shrink-0",
                          day.isToday
                            ? "w-6 h-6 sm:w-7.5 sm:h-7.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/25 dark:from-amber-500 dark:to-orange-500 dark:text-slate-950 dark:shadow-amber-500/25"
                            : "w-6 h-6 sm:w-7.5 sm:h-7.5",
                          day.isToday
                            ? ""
                            : (day.isCurrentMonth
                                ? "text-slate-800 dark:text-slate-100"
                                : "text-slate-350 dark:text-slate-650"),
                        ].join(" ")}
                      >
                        {day.dayNumber}
                      </span>
                      {day.isToday && (
                        <span className="text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full z-10 shrink-0 scale-90 sm:scale-95
                          text-violet-600 dark:text-amber-400 bg-violet-100/60 dark:bg-amber-400/10">
                          Hôm nay
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 space-y-0.5 sm:mt-2 sm:space-y-1">
                      {renderDayAmount(dayEntry?.totals.income ?? 0, "income")}
                      {renderDayAmount(dayEntry?.totals.expense ?? 0, "expense")}
                    </div>

                    {hasTransactions && !isSelected ? (
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-500 sm:mt-2" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 gap-3 ${type === "both" ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          {(type === "income" || type === "both") && (
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Thu nhập</p>
              {renderSummaryValue(monthTotals.income, "income")}
            </div>
          )}
          
          {(type === "expense" || type === "both") && (
            <div className="rounded-2xl border border-red-200/70 bg-red-50/80 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/10">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">Chi tiêu</p>
              {renderSummaryValue(monthTotals.expense, "expense")}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Số dư ròng</p>
            {renderSummaryValue(monthTotals.net, "net")}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
          {selectedDayMoment ? (
            <>
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h6 className="text-sm font-semibold text-slate-900 dark:text-white sm:text-base">
                    {selectedDayMoment.isSame(moment(), "day")
                      ? `Hôm nay - ${selectedDayMoment.format("DD/MM/YYYY")}`
                      : selectedDayMoment.format("DD/MM/YYYY")}
                  </h6>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {selectedDayTransactions.length} giao dịch trong ngày được chọn
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                  {(type === "income" || type === "both") ? (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                      + {addThousandsSeparator(selectedDayTotals.income)}đ
                    </span>
                  ) : null}
                  {(type === "expense" || type === "both") ? (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-red-500 dark:bg-red-500/10 dark:text-red-400">
                      - {addThousandsSeparator(selectedDayTotals.expense)}đ
                    </span>
                  ) : null}
                </div>
              </div>

              {selectedDayTransactions.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h6 className="text-sm font-semibold text-slate-900 dark:text-white">Danh sách giao dịch</h6>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                          Chọn từng giao dịch để xem chi tiết rõ hơn.
                        </p>
                      </div>
                      {activeTransaction ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:bg-white/10 dark:text-slate-300">
                          Đang xem #{activeTransaction.id}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 max-h-[420px] overflow-y-auto pr-1">
                      {selectedDayTransactions.map((transaction) => (
                        <TransactionInfoCard
                          key={transaction.id}
                          title={transaction.name}
                          icon={transaction.icon}
                          category={transaction.categoryName}
                          receiptLocation={transaction.receiptLocation}
                          date={normalizeTransactionMoment(transaction.date)?.format("DD/MM/YYYY") ?? ""}
                          amount={transaction.amount}
                          type={transaction.type}
                          isSelected={activeTransaction?.id === transaction.id}
                          onSelect={() => setSelectedTransactionId(transaction.id)}
                          onDelete={() => onDelete?.(transaction.id)}
                          onEdit={() => onEdit?.(transaction)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 sm:p-5 dark:border-white/10 dark:bg-white/[0.03] shadow-sm flex flex-col gap-4">
                    <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 dark:border-white/10">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Chi tiết giao dịch
                      </p>
                      
                      <div className="flex items-center gap-3.5 mt-2">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 text-xl flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-white/10 shadow-sm">
                          {renderTransactionIcon(activeTransaction?.icon)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border mb-1 ${
                            activeTransaction?.type === 'income' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-250 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                              : 'bg-red-50 text-red-750 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                          }`}>
                            {activeTransaction?.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                          </span>
                          <h6 className="text-base font-bold text-slate-800 dark:text-white truncate">
                            {activeTransaction?.name || "Không có dữ liệu"}
                          </h6>
                        </div>
                      </div>
                      
                      {activeTransaction ? (
                        <p className={`text-lg font-black mt-1 ${activeTransaction.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                          {activeTransaction.type === "income" ? "+ " : "- "}
                          {addThousandsSeparator(activeTransaction.amount)}đ
                        </p>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-1">
                      {/* Ngày */}
                      <div className="flex flex-col p-3 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1">
                          <Calendar size={13} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Ngày GD</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {normalizeTransactionMoment(activeTransaction?.date)?.format("DD/MM/YYYY") || "Không có"}
                        </span>
                      </div>

                      {/* Danh mục */}
                      <div className="flex flex-col p-3 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1">
                          <Tag size={13} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Danh mục</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                          {activeTransaction?.categoryName || "Chưa phân loại"}
                        </span>
                      </div>

                      {/* Mã giao dịch */}
                      <div className="flex flex-col p-3 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1">
                          <Hash size={13} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Mã GD</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {activeTransaction?.id != null ? `#${activeTransaction.id}` : "Không có"}
                        </span>
                      </div>

                      {/* Hóa đơn */}
                      <div className="flex flex-col p-3 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1">
                          <FileText size={13} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Hóa đơn</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate" title={activeTransaction?.receiptLocation || "Không có"}>
                          {activeTransaction?.receiptLocation || "Không có"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-400 dark:border-white/10 dark:text-slate-500">
                  Không có giao dịch trong ngày đã chọn.
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-400 dark:border-white/10 dark:text-slate-500">
              Chọn một ngày trên lịch để xem chi tiết giao dịch.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionCalendar;

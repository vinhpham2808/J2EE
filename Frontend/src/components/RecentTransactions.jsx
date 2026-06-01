import moment from "moment";

const RecentTransactions = ({ transactions, onMore }) => {
  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Giao dịch gần đây</h3>
        <button
          onClick={onMore}
          className="text-amber-600 dark:text-amber-400 text-xs font-semibold hover:underline uppercase tracking-widest"
        >
          Xem tất cả
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tên giao dịch</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ngày</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:table-cell">Danh mục</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Số tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {transactions?.slice(0, 5)?.map((item, index) => {
              const isExpense = item.type === "expense";
              const amountStr = item.amount ? item.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
              const rawCategory = item.category || item.type;
              const displayCategory = rawCategory
                ? (rawCategory.toLowerCase() === "expense" ? "Chi tiêu" : (rawCategory.toLowerCase() === "income" ? "Thu nhập" : rawCategory))
                : "";
              return (
                <tr key={item.id || index} className="hover:bg-slate-50 dark:hover:bg-white/3 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0
                        ${isExpense ? "bg-red-100 dark:bg-red-500/15" : "bg-emerald-100 dark:bg-emerald-500/15"}`}>
                        {item.icon && (item.icon.startsWith("data:image/") || item.icon.startsWith("http")) ? (
                           <img src={item.icon} alt="" className="w-6 h-6 object-contain rounded" />
                        ) : (
                          <span>{item.icon || (isExpense ? "💳" : "💰")}</span>
                        )}
                      </div>
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate max-w-35">
                        {item.name || item.title || "Giao dịch"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {moment(item.date).format("DD/MM/YYYY")}
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase truncate max-w-25 inline-block
                      bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">
                      {displayCategory}
                    </span>
                  </td>
                  <td className={`px-4 py-4 text-right text-sm font-bold whitespace-nowrap ${isExpense ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {isExpense ? "-" : "+"} {amountStr}đ
                  </td>
                </tr>
              );
            })}
            {(!transactions || transactions.length === 0) && (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                  Chưa có giao dịch nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentTransactions;

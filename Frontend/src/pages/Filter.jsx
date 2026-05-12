import Dashboard from "../components/Dashboard.jsx";
import {useUser} from "../hooks/useUser.jsx";
import {Search, ChevronDown} from "lucide-react";
import {useState} from "react";
import axiosConfig from "../util/axiosConfig.jsx";
import {API_ENDPOINTS} from "../util/apiEndpoints.js";
import toast from "react-hot-toast";
import TransactionInfoCard from "../components/TransactionInfoCard.jsx";
import moment from "moment";
import { usePageTitle } from "../hooks/usePageTitle.js";

const Filter = () => {
    useUser();
    usePageTitle("Lọc giao dịch");
    const [type, setType] = useState("income");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [keyword, setKeyword] = useState("");
    const [sortField, setSortField] = useState("date");
    const [sortOrder, setSortOrder] = useState("asc");
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axiosConfig.post(API_ENDPOINTS.APPLY_FILTERS, {
                type,
                startDate: startDate || null,
                endDate: endDate || null,
                keyword,
                sortField: sortField === "category" ? "category.name" : sortField,
                sortOrder
            });
            console.log('transactions: ', response.data);
            setTransactions(response.data);
        }catch (error) {
            console.error('Failed to fetch transactions: ', error);
            toast.error(error.message || "Lỗi khi tải giao dịch. Vui lòng thử lại");
        }finally {
            setLoading(false);
        }

    }

    return (
        <Dashboard activeMenu="Bộ lọc">
            <div className="my-5 mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                            Bộ lọc giao dịch
                        </h2>
                        <p className="mt-1 text-slate-500 dark:text-slate-400">
                            Tìm kiếm và phân tích giao dịch theo nhiều tiêu chí
                        </p>
                    </div>
                </div>

                {/* ── Filter Panel ── */}
                <div className="card">
                    <h5 className="text-lg font-semibold text-slate-800 dark:text-white mb-5">
                        Chọn các bộ lọc
                    </h5>
                    <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5" htmlFor="type">
                                Loại
                            </label>
                            <div className="relative">
                                <select
                                    value={type}
                                    id="type"
                                    className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors appearance-none pr-8
                                        bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10
                                        text-slate-900 dark:text-white
                                        focus:border-violet-500 dark:focus:border-amber-500 focus:ring-1 focus:ring-violet-500/30 dark:focus:ring-amber-500/30"
                                    onChange={e => setType(e.target.value)}
                                >
                                    <option value="income" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Thu nhập</option>
                                    <option value="expense" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Chi tiêu</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="startdate" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                Từ ngày
                            </label>
                            <input
                                value={startDate}
                                id="startdate"
                                type="date"
                                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors
                                    bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10
                                    text-slate-900 dark:text-white
                                    focus:border-violet-500 dark:focus:border-amber-500 focus:ring-1 focus:ring-violet-500/30 dark:focus:ring-amber-500/30
                                    scheme-dark"
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="enddate" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                Đến ngày
                            </label>
                            <input
                                value={endDate}
                                id="enddate"
                                type="date"
                                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors
                                    bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10
                                    text-slate-900 dark:text-white
                                    focus:border-violet-500 dark:focus:border-amber-500 focus:ring-1 focus:ring-violet-500/30 dark:focus:ring-amber-500/30
                                    scheme-dark"
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="sortfield" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                Sắp xếp theo
                            </label>
                            <div className="relative">
                                <select
                                    value={sortField}
                                    id="sortfield"
                                    className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors appearance-none pr-8
                                        bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10
                                        text-slate-900 dark:text-white
                                        focus:border-violet-500 dark:focus:border-amber-500 focus:ring-1 focus:ring-violet-500/30 dark:focus:ring-amber-500/30"
                                    onChange={e => setSortField(e.target.value)}
                                >
                                    <option value="date" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Ngày</option>
                                    <option value="amount" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Số tiền</option>
                                    <option value="category" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Danh mục</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="sortorder" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                Thứ tự
                            </label>
                            <div className="relative">
                                <select
                                    value={sortOrder}
                                    id="sortorder"
                                    className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors appearance-none pr-8
                                        bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10
                                        text-slate-900 dark:text-white
                                        focus:border-violet-500 dark:focus:border-amber-500 focus:ring-1 focus:ring-violet-500/30 dark:focus:ring-amber-500/30"
                                    onChange={e => setSortOrder(e.target.value)}
                                >
                                    <option value="asc" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Tăng dần</option>
                                    <option value="desc" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Giảm dần</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" />
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <label htmlFor="keyword" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                    Tìm kiếm
                                </label>
                                <input
                                    value={keyword}
                                    id="keyword"
                                    type="text"
                                    placeholder="Từ khóa..."
                                    className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors
                                        bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10
                                        text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500
                                        focus:border-violet-500 dark:focus:border-amber-500 focus:ring-1 focus:ring-violet-500/30 dark:focus:ring-amber-500/30"
                                    onChange={e => setKeyword(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                className="shrink-0 p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all duration-150 active:scale-95 cursor-pointer"
                            >
                                <Search size={20} />
                            </button>
                        </div>
                    </form>
                </div>

                {/* ── Results Panel ── */}
                <div className="card">
                    <h5 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                        Kết quả giao dịch
                        {transactions.length > 0 && (
                            <span className="ml-2 text-sm font-normal text-slate-400 dark:text-slate-500">
                                ({transactions.length} giao dịch)
                            </span>
                        )}
                    </h5>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 dark:border-white/10 border-t-violet-600 dark:border-t-amber-500"></div>
                            <p className="mt-4 text-slate-500 dark:text-slate-400">Đang tải giao dịch...</p>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-100 dark:border-white/10 rounded-xl bg-slate-50/50 dark:bg-white/3">
                            <Search size={48} className="text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="font-medium text-slate-500 dark:text-slate-400">
                                Chưa có dữ liệu giao dịch
                            </p>
                            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                                Chọn bộ lọc và nhấn tìm kiếm để phân tích dữ liệu
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {transactions.map((transaction) => (
                                <TransactionInfoCard
                                    key={transaction.id}
                                    title={transaction.name}
                                    icon={transaction.icon}
                                    date={moment(transaction.date).format('DD/MM/YYYY')}
                                    amount={transaction.amount}
                                    type={type}
                                    hideDeleteBtn
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Dashboard>
    )
}

export default Filter;
import Dashboard from "../components/Dashboard.jsx";
import {useUser} from "../hooks/useUser.jsx";
import {Search} from "lucide-react";
import CustomSelect from "../components/CustomSelect.jsx";
import {useState} from "react";
import axiosConfig from "../util/axiosConfig.jsx";
import {API_ENDPOINTS} from "../util/apiEndpoints.js";
import toast from "react-hot-toast";
import TransactionInfoCard from "../components/TransactionInfoCard.jsx";
import moment from "moment";
import { usePageTitle } from "../hooks/usePageTitle.js";
import DateInput from "../components/DateInput.jsx";

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
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Loại</label>
                            <CustomSelect
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                options={[
                                    { value: "income", label: "Thu nhập" },
                                    { value: "expense", label: "Chi tiêu" },
                                ]}
                                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-violet-500 dark:focus:border-amber-500 focus:ring-1 focus:ring-violet-500/30 dark:focus:ring-amber-500/30"
                            />
                        </div>
                        <div>
                            <label htmlFor="startdate" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                Từ ngày
                            </label>
                            <DateInput
                                value={startDate}
                                id="startdate"
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
                            <DateInput
                                value={endDate}
                                id="enddate"
                                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors
                                    bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10
                                    text-slate-900 dark:text-white
                                    focus:border-violet-500 dark:focus:border-amber-500 focus:ring-1 focus:ring-violet-500/30 dark:focus:ring-amber-500/30
                                    scheme-dark"
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Sắp xếp theo</label>
                            <CustomSelect
                                value={sortField}
                                onChange={(e) => setSortField(e.target.value)}
                                options={[
                                    { value: "date", label: "Ngày" },
                                    { value: "amount", label: "Số tiền" },
                                    { value: "category", label: "Danh mục" },
                                ]}
                                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-violet-500 dark:focus:border-amber-500 focus:ring-1 focus:ring-violet-500/30 dark:focus:ring-amber-500/30"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Thứ tự</label>
                            <CustomSelect
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                options={[
                                    { value: "asc", label: "Tăng dần" },
                                    { value: "desc", label: "Giảm dần" },
                                ]}
                                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-violet-500 dark:focus:border-amber-500 focus:ring-1 focus:ring-violet-500/30 dark:focus:ring-amber-500/30"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="keyword" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                Tìm kiếm
                            </label>
                            <div className="flex items-center gap-2 w-full">
                                <div className="relative flex-1 group">
                                    <input
                                        value={keyword}
                                        id="keyword"
                                        type="text"
                                        placeholder="Từ khóa..."
                                        className="search-input pl-10 w-full"
                                        onChange={e => setKeyword(e.target.value)}
                                    />
                                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 dark:group-focus-within:text-amber-500 transition-colors pointer-events-none" />
                                </div>
                                <button
                                    onClick={handleSearch}
                                    className="shrink-0 p-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-600/10 hover:shadow-violet-600/25 transition-all duration-300 active:scale-[0.95] cursor-pointer"
                                >
                                    <Search size={18} />
                                </button>
                            </div>
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
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] animate-pulse">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10" />
                                        <div className="space-y-2">
                                            <div className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded" />
                                            <div className="h-3 w-20 bg-slate-200 dark:bg-white/10 rounded" />
                                        </div>
                                    </div>
                                    <div className="h-5 w-24 bg-slate-200 dark:bg-white/10 rounded-lg" />
                                </div>
                            ))}
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

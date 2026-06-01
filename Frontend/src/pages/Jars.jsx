import { useEffect, useState, useContext } from "react";
import toast from "react-hot-toast";
import { useUser } from "../hooks/useUser.jsx";
import axiosConfig from "../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import Dashboard from "../components/Dashboard.jsx";
import JarCard from "../components/JarCard.jsx";
import JarForm from "../components/JarForm.jsx";
import JarTransferModal from "../components/JarTransferModal.jsx";
import JarsSetup from "../components/JarsSetup.jsx";
import Modal from "../components/Modal.jsx";
import DeleteAlert from "../components/DeleteAlert.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";
import { AppContext } from "../context/AppContext.jsx";
import { Plus, ArrowLeftRight, Vault, TrendingUp, TrendingDown, Wallet, AlertTriangle, ArrowLeft, PieChart as PieChartIcon, Search } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import TransactionInfoCard from "../components/TransactionInfoCard.jsx";
import AddExpenseForm from "../components/AddExpenseForm.jsx";
import EditExpenseForm from "../components/EditExpenseForm.jsx";
import { hasDisplayImage } from "../util/imageDisplay.js";
import { getTodayIsoDate, isIsoDateAfter } from "../util/dateInput.js";

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n ?? 0);

const Jars = () => {
  useUser();
  usePageTitle("Hũ chi tiêu");

  const { user } = useContext(AppContext);

  const [jars, setJars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editJar, setEditJar] = useState(null);
  const [deleteAlert, setDeleteAlert] = useState({ show: false, id: null });
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedJarId, setSelectedJarId] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [openAddExpenseModal, setOpenAddExpenseModal] = useState(false);
  const [openEditExpenseModal, setOpenEditExpenseModal] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [openDeleteExpenseAlert, setOpenDeleteExpenseAlert] = useState({ show: false, id: null });
  const [searchQuery, setSearchQuery] = useState("");

  const selectedJar = jars.find((j) => j.id === selectedJarId) || null;

  const fetchJars = async () => {
    setLoading(true);
    try {
      const res = await axiosConfig.get(API_ENDPOINTS.GET_JARS);
      if (res.data) setJars(res.data);
    } catch (err) {
      console.error("Lỗi tải hũ:", err);
      toast.error("Không thể tải danh sách hũ chi tiêu.");
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await axiosConfig.get(`${API_ENDPOINTS.GET_ALL_EXPENSE}?all=true`);
      if (res.data) setExpenses(res.data);
    } catch (err) {
      console.error("Lỗi tải chi tiêu:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axiosConfig.get(API_ENDPOINTS.CATEGORY_BY_TYPE("expense"));
      if (res.data) setCategories(res.data);
    } catch (err) {
      console.error("Lỗi tải danh mục chi tiêu:", err);
    }
  };

  useEffect(() => { fetchJars(); fetchExpenses(); fetchCategories(); }, []);

  const handleAddExpense = async (expense) => {
    const { name, categoryId, amount, date, icon, jarId } = expense;
    if (!name.trim()) { toast.error("Vui lòng nhập tên chi tiêu."); return; }
    if (!categoryId) { toast.error("Vui lòng chọn danh mục."); return; }
    if (!amount || isNaN(amount) || Number(amount) <= 0) { toast.error("Số tiền phải lớn hơn 0."); return; }
    if (!date) { toast.error("Vui lòng chọn ngày."); return; }
    const today = getTodayIsoDate();
    if (isIsoDateAfter(date, today)) { toast.error("Ngày không được chọn ở tương lai."); return; }

    try {
      const response = await axiosConfig.post(API_ENDPOINTS.ADD_EXPENSE, {
        name,
        categoryId: Number(categoryId),
        amount: Number(amount),
        date,
        icon,
        jarId: jarId ? Number(jarId) : null,
      });
      setOpenAddExpenseModal(false);
      toast.success("Thêm chi tiêu thành công");
      const budgetStatus = response.data?.budgetStatus;
      if (budgetStatus?.hasBudget) {
        const pct = (budgetStatus.usageRatio * 100).toFixed(1);
        if (budgetStatus.isExceeded) {
          toast.error(`🚨 Vượt hạn mức "${budgetStatus.categoryName}"!\nĐã chi ${fmt(budgetStatus.totalSpent)} / ${fmt(budgetStatus.amountLimit)} (${pct}%)`, { duration: 6000 });
        } else if (budgetStatus.isWarning) {
          toast(`⚠️ Sắp hết hạn mức "${budgetStatus.categoryName}"\nĐã chi ${fmt(budgetStatus.totalSpent)} / ${fmt(budgetStatus.amountLimit)} (${pct}%)`,
            { icon: "⚠️", duration: 5000, style: { background: "#f39c12", color: "#fff" } });
        }
      }
      fetchJars();
      fetchExpenses();
    } catch (error) {
      console.error("Error adding expense:", error.response?.data?.message || error.message);
      toast.error(error.response?.data?.message || "Không thể thêm chi tiêu.");
    }
  };

  const handleUpdateExpense = async (expense) => {
    const { id, name, categoryId, amount, date, icon, jarId } = expense;
    if (!name.trim()) { toast.error("Vui lòng nhập tên chi tiêu."); return; }
    if (!categoryId) { toast.error("Vui lòng chọn danh mục."); return; }
    if (!amount || isNaN(amount) || Number(amount) <= 0) { toast.error("Số tiền phải lớn hơn 0."); return; }
    if (!date) { toast.error("Vui lòng chọn ngày."); return; }
    const today = getTodayIsoDate();
    if (isIsoDateAfter(date, today)) { toast.error("Ngày không được chọn ở tương lai."); return; }

    try {
      const response = await axiosConfig.put(API_ENDPOINTS.UPDATE_EXPENSE(id), {
        name,
        categoryId: Number(categoryId),
        amount: Number(amount),
        date,
        icon,
        jarId: jarId ? Number(jarId) : null,
      });
      setOpenEditExpenseModal(false);
      setExpenseToEdit(null);
      toast.success("Cập nhật chi tiêu thành công");
      const budgetStatus = response.data?.budgetStatus;
      if (budgetStatus?.hasBudget) {
        const pct = (budgetStatus.usageRatio * 100).toFixed(1);
        if (budgetStatus.isExceeded) {
          toast.error(`🚨 Vượt hạn mức "${budgetStatus.categoryName}"!\nĐã chi ${fmt(budgetStatus.totalSpent)} / ${fmt(budgetStatus.amountLimit)} (${pct}%)`, { duration: 6000 });
        } else if (budgetStatus.isWarning) {
          toast(`⚠️ Sắp hết hạn mức "${budgetStatus.categoryName}"\nĐã chi ${fmt(budgetStatus.totalSpent)} / ${fmt(budgetStatus.amountLimit)} (${pct}%)`,
            { icon: "⚠️", duration: 5000, style: { background: "#f39c12", color: "#fff" } });
        }
      }
      fetchJars();
      fetchExpenses();
    } catch (error) {
      console.error("Error updating expense:", error.response?.data?.message || error.message);
      toast.error(error.response?.data?.message || "Không thể cập nhật chi tiêu.");
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await axiosConfig.delete(API_ENDPOINTS.DELETE_EXPENSE(id));
      setOpenDeleteExpenseAlert({ show: false, id: null });
      toast.success("Xóa chi tiêu thành công.");
      fetchJars();
      fetchExpenses();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể xóa chi tiêu.");
    }
  };

  const handleCreateJar = async (dto) => {
    try {
      await axiosConfig.post(API_ENDPOINTS.ADD_JAR, dto);
      toast.success("Tạo hũ chi tiêu thành công!");
      setShowAddModal(false);
      fetchJars();
    } catch (err) {
      toast.error(err.response?.data?.error || "Không thể tạo hũ. Vui lòng thử lại.");
    }
  };

  const handleUpdateJar = async (dto) => {
    try {
      const promises = [
        axiosConfig.put(API_ENDPOINTS.UPDATE_JAR(editJar.id), {
          name: dto.name,
          icon: dto.icon,
          color: dto.color,
          targetPercentage: dto.targetPercentage
        })
      ];

      if (dto.balancingJarId) {
        const balJar = jars.find(j => j.id === dto.balancingJarId);
        if (balJar) {
          const balNewPct = Math.max(0, (balJar.targetPercentage || 0) - dto.balancingPercentageDiff);
          promises.push(
            axiosConfig.put(API_ENDPOINTS.UPDATE_JAR(dto.balancingJarId), {
              name: balJar.name,
              icon: balJar.icon,
              color: balJar.color,
              targetPercentage: balNewPct
            })
          );
        }
      }

      await Promise.all(promises);
      toast.success("Cập nhật hũ và cân đối tỷ lệ phân bổ thành công!");
      setEditJar(null);
      fetchJars();
    } catch (err) {
      toast.error(err.response?.data?.error || "Không thể cập nhật hũ.");
    }
  };

  const handleDeleteJar = async (id) => {
    try {
      await axiosConfig.delete(API_ENDPOINTS.DELETE_JAR(id));
      toast.success("Đã xoá hũ.");
      setDeleteAlert({ show: false, id: null });
      fetchJars();
    } catch (err) {
      toast.error(err.response?.data?.error || "Không thể xoá hũ.");
    }
  };

  const handleTransfer = async (fromJarId, toJarId, amount) => {
    try {
      await axiosConfig.post(API_ENDPOINTS.TRANSFER_JAR, { fromJarId, toJarId, amount });
      toast.success("Chuyển tiền thành công!");
      setShowTransferModal(false);
      fetchJars();
    } catch (err) {
      toast.error(err.response?.data?.error || "Không thể chuyển tiền.");
    }
  };

  const totalBalance = jars.reduce((sum, j) => sum + (j.currentBalance ?? 0), 0);
  const totalPercentage = jars.reduce((sum, j) => sum + (j.targetPercentage ?? 0), 0);

  const pieData = jars
    .filter((j) => j.currentBalance > 0)
    .map((j) => ({
      name: j.name,
      value: j.currentBalance,
      color: j.color || "#8B5CF6",
    }));

  const plan = user?.subscriptionPlan || "FREE";
  const maxJars = user?.jarLimit === -1 ? Infinity : (user?.jarLimit ?? 1);
  const canCreate = jars.length < maxJars;

  if (selectedJar) {
    const jarExpenses = expenses.filter(e => e.jarId === selectedJar.id);
    const categoryMap = {};
    jarExpenses.forEach(e => {
      categoryMap[e.categoryName] = (categoryMap[e.categoryName] || 0) + Number(e.amount);
    });
    
    const COLORS = ['#8B5CF6', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#EC4899', '#F97316', '#14B8A6'];
    const chartData = Object.entries(categoryMap)
      .map(([name, value], index) => ({ name, value, color: COLORS[index % COLORS.length] }))
      .sort((a, b) => b.value - a.value); // Sort by highest spend
      
    const sortedExpenses = [...jarExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalSpent = jarExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const filteredExpenses = sortedExpenses.filter(expense => 
      expense.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (expense.categoryName && expense.categoryName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const actualPercent = totalBalance > 0
      ? ((selectedJar.currentBalance / totalBalance) * 100).toFixed(1)
      : "0.0";
    const progressWidth = Math.min(
      Math.abs(selectedJar.currentBalance) / (totalBalance > 0 ? totalBalance : 1) * 100,
      100
    );
    const isNegative = selectedJar.currentBalance < 0;

    return (
      <Dashboard activeMenu="Hũ chi tiêu">
        <div className="my-5 mx-auto space-y-6 animate-in fade-in duration-200">
          
          {/* Top Navigation & Breadcrumbs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => { setSelectedJarId(null); setSearchQuery(""); }} 
                className="group flex items-center justify-center w-10 h-10 rounded-2xl bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm transition-all duration-200 cursor-pointer"
                title="Quay lại danh sách hũ"
              >
                <ArrowLeft size={20} className="text-slate-500 dark:text-slate-350 group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                  <span>Hũ chi tiêu</span>
                  <span>/</span>
                  <span className="text-slate-500 dark:text-slate-400">{selectedJar.name}</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Chi tiết hũ phân bổ</h2>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditJar(selectedJar)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold
                  border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300
                  hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all duration-200 cursor-pointer"
              >
                Cài đặt hũ
              </button>
            </div>
          </div>

          {/* Hero Banner Card */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-950 shadow-md p-6 sm:p-8 border border-slate-200 dark:border-slate-800 rounded-3xl">

            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              {/* Left Content (Jar Info & Balance) */}
              <div className="flex-1 space-y-5">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-white/20 dark:border-white/10" 
                    style={{ backgroundColor: `${selectedJar.color || '#F59E0B'}20` }}
                  >
                    {selectedJar.icon ? (
                      hasDisplayImage(selectedJar.icon) ? (
                        <img src={selectedJar.icon} alt={selectedJar.name} className="w-10 h-10 object-contain" />
                      ) : (
                        <span className="text-3xl select-none">{selectedJar.icon}</span>
                      )
                    ) : (
                      <Vault size={32} style={{ color: selectedJar.color || "#F59E0B" }} />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                      {selectedJar.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
                        Mục tiêu phân bổ: <span className="font-bold text-amber-500">{selectedJar.targetPercentage ?? 0}%</span>
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-650 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
                        Tỷ trọng thực tế: <span className="font-bold" style={{ color: selectedJar.color || "#F59E0B" }}>{actualPercent}%</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Số dư hiện tại</p>
                  <p className={`text-4xl sm:text-5xl font-black tracking-tight ${isNegative ? "text-rose-500" : "text-slate-800 dark:text-white"}`}>
                    {fmt(selectedJar.currentBalance)}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden shadow-inner border border-slate-200/20 dark:border-white/5">
                    <div
                      className="h-full rounded-full transition-[width] duration-1000 ease-out relative"
                      style={{
                        width: `${progressWidth}%`,
                        backgroundColor: isNegative ? "#EF4444" : (selectedJar.color || "#F59E0B"),
                        boxShadow: isNegative ? '0 0 12px rgba(239, 68, 68, 0.5)' : `0 0 12px ${(selectedJar.color || '#F59E0B')}80`,
                      }}
                    >
                      
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Content (Quick Stats Grid) */}
              <div className="grid grid-cols-2 gap-4 w-full lg:max-w-md shrink-0 z-10">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-colors">
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">Tổng đã chi tiêu</div>
                  <div className="text-xl font-bold text-slate-800 dark:text-white mt-1">{fmt(totalSpent)}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Từ hũ này</div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-colors">
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">Tổng giao dịch</div>
                  <div className="text-xl font-bold text-slate-800 dark:text-white mt-1">{sortedExpenses.length}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Bản ghi chi tiêu</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-colors col-span-2 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">Mục tiêu vs Thực tế</div>
                    <div className="text-sm font-semibold text-slate-755 dark:text-slate-300 mt-1">
                      {selectedJar.targetPercentage ?? 0}% vs {actualPercent}%
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 dark:bg-violet-500/10 text-violet-650 dark:text-violet-400">
                    {Number(actualPercent) >= (selectedJar.targetPercentage ?? 0) ? (
                      <>
                        <TrendingUp size={12} /> Đạt mục tiêu
                      </>
                    ) : (
                      <>
                        <TrendingDown size={12} /> Dưới mục tiêu
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Pie Chart (occupies 5 columns) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="card border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 shadow-lg p-6 rounded-3xl transition-all duration-300 h-full flex flex-col backdrop-blur-md">
                <h3 className="text-base font-bold text-slate-850 dark:text-slate-300 mb-6 flex items-center gap-2">
                  <PieChartIcon size={18} className="text-violet-500" />
                  Cấu trúc chi tiêu
                </h3>
                
                {chartData.length === 0 ? (
                  <div className="flex-1 py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center mb-3">
                      <TrendingDown size={24} className="text-slate-300 dark:text-slate-550" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Chưa có chi tiêu nào</p>
                    <p className="text-xs text-slate-450 mt-1">Các khoản chi từ hũ này sẽ hiện ở đây</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-between">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                          strokeWidth={0}
                          animationDuration={300}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => fmt(value)}
                          contentStyle={{ 
                            backgroundColor: "rgba(15, 23, 42, 0.95)", 
                            border: "1px solid rgba(255,255,255,0.1)", 
                            borderRadius: "16px", 
                            color: "#fff", 
                            fontSize: "13px",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                          }}
                          itemStyle={{ color: "#fff", fontWeight: 500 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    <div className="mt-6 space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                      {chartData.map((item, i) => (
                        <div key={i} className="group flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/[0.04] border border-transparent hover:border-slate-100 dark:hover:border-white/5 transition-all duration-200">
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="w-3 h-3 rounded-full shrink-0 shadow-sm transition-transform group-hover:scale-110" style={{ backgroundColor: item.color }} />
                            <span className="text-slate-700 dark:text-slate-350 font-bold truncate text-xs">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                              {((item.value / (totalSpent || 1)) * 100).toFixed(1)}%
                            </span>
                            <span className="font-extrabold text-slate-800 dark:text-white text-xs">{fmt(item.value)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Transactions History (occupies 7 columns) */}
            <div className="lg:col-span-7">
              <div className="card border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl h-full flex flex-col shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                      Lịch sử giao dịch
                    </h3>
                    <span className="text-xs font-bold px-2.5 py-1 bg-violet-100 dark:bg-violet-500/10 text-violet-650 dark:text-violet-400 rounded-full">
                      {sortedExpenses.length} giao dịch
                    </span>
                  </div>
                  <button
                    onClick={() => setOpenAddExpenseModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold
                      bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Plus size={14} />
                    Thêm chi tiêu
                  </button>
                </div>

                {/* Search Input Box */}
                <div className="relative mb-4 shrink-0">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search size={16} className="text-slate-400 dark:text-slate-500" />
                  </span>
                  <input
                    type="text"
                    placeholder="Tìm kiếm giao dịch hoặc danh mục..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 rounded-2xl text-slate-800 dark:text-slate-100 placeholder-slate-455 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Xóa
                    </button>
                  )}
                </div>
                
                {filteredExpenses.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                    {searchQuery ? (
                      <>
                        <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3">
                          <Search size={24} className="text-slate-350 dark:text-slate-500" />
                        </div>
                        <p className="text-base font-bold text-slate-655 dark:text-slate-300">Không tìm thấy kết quả</p>
                        <p className="text-xs text-slate-405 mt-1">Vui lòng thử tìm từ khóa khác hoặc xóa bộ lọc.</p>
                      </>
                    ) : (
                      <>
                        <Vault size={80} className="text-slate-300 dark:text-slate-600 mb-4 opacity-50" />
                        <p className="text-base font-bold text-slate-600 dark:text-slate-300">Hũ đang trống</p>
                        <p className="text-xs text-slate-450 mt-1 max-w-[250px] mx-auto">Hãy thêm chi tiêu hoặc chuyển tiền vào hũ này để theo dõi dòng tiền.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3 custom-scrollbar max-h-[500px] h-[500px]">
                    {filteredExpenses.map((expense, idx) => (
                      <div 
                        key={expense.id} 
                        className="animate-in fade-in duration-150"
                        style={{ animationDelay: `${Math.min(idx * 40, 400)}ms`, animationFillMode: 'both' }}
                      >
                        <TransactionInfoCard
                          icon={expense.icon}
                          title={expense.name}
                          date={expense.date}
                          amount={expense.amount}
                          type="expense"
                          hideDeleteBtn={false}
                          onDelete={() => setOpenDeleteExpenseAlert({ show: true, id: expense.id })}
                          onEdit={() => { setExpenseToEdit(expense); setOpenEditExpenseModal(true); }}
                          category={expense.categoryName}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </Dashboard>
    );
  }

  if (jars.length === 0 && !loading) {
    return (
      <Dashboard activeMenu="Hũ chi tiêu">
        <div className="my-5 mx-auto space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
              <Vault size={28} className="text-amber-500" />
              Hũ chi tiêu
            </h2>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Phân bổ thu nhập & quản lý tiền theo từng ví phụ
            </p>
          </div>
          <JarsSetup onComplete={fetchJars} />
        </div>
      </Dashboard>
    );
  }

  return (
    <Dashboard activeMenu="Hũ chi tiêu">
      <div className="my-5 mx-auto space-y-6 animate-in fade-in duration-200">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
              <Vault size={28} className="text-amber-500" />
              Hũ chi tiêu
            </h2>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Phân bổ thu nhập & quản lý tiền theo từng ví phụ
            </p>
          </div>
          <div className="flex gap-2">
            {jars.length >= 2 && (
              <button
                onClick={() => setShowTransferModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium
                  border border-slate-200 dark:border-white/10
                  text-slate-700 dark:text-slate-300
                  hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                <ArrowLeftRight size={16} />
                Chuyển tiền
              </button>
            )}
            <button
              disabled={!canCreate}
              onClick={() => { if (canCreate) setShowAddModal(true); else toast.error(`Gói ${plan} chỉ cho phép tối đa ${maxJars} hũ. Hãy nâng cấp!`); }}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium
                bg-amber-500 text-white transition-colors shadow-sm
                ${canCreate ? "hover:bg-amber-600 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
            >
              <Plus size={16} />
              Tạo hũ mới
            </button>
          </div>
        </div>

        {/* ── Overview cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <Wallet size={20} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Tổng số dư</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{fmt(totalBalance)}</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
              <Vault size={20} className="text-violet-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Số hũ đang dùng</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{jars.length} / {maxJars === Infinity ? "∞" : maxJars}</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <TrendingUp size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Tổng % phân bổ</p>
              <p className={`text-lg font-bold ${totalPercentage > 100 ? "text-red-500" : "text-slate-800 dark:text-white"}`}>
                {totalPercentage.toFixed(1)}%
                {totalPercentage > 100 && <AlertTriangle size={14} className="inline ml-1 text-red-500" />}
              </p>
            </div>
          </div>
        </div>

        {/* ── Pie Chart + Jar Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie chart */}
          {pieData.length > 0 && (
            <div className="card lg:col-span-1">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Phân bổ số dư</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => fmt(value)}
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      border: "none",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {pieData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-slate-400 truncate flex-1">{item.name}</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{fmt(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Jar cards grid */}
          <div className={`${pieData.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}`}>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="card relative overflow-hidden p-5 border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-white/[0.02]">
                    {/* Color accent bar placeholder */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700" />
                    
                    {/* Header placeholder */}
                    <div className="flex items-start justify-between mt-1 mb-3">
                      <div className="flex items-center gap-3 w-full">
                        {/* Icon placeholder */}
                        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0" />
                        {/* Title & subtitle placeholder */}
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
                          <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
                        </div>
                      </div>
                    </div>

                    {/* Balance placeholder */}
                    <div className="h-8 w-2/3 bg-slate-200 dark:bg-slate-700 rounded mb-4" />

                    {/* Progress bar placeholder */}
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between">
                        <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-700 rounded" />
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    </div>

                    {/* Status tag placeholder */}
                    <div className="h-5 w-1/3 bg-slate-200 dark:bg-slate-700 rounded mt-2" />
                  </div>
                ))}
              </div>
            ) : jars.length === 0 ? (
              <div className="card text-center py-12">
                <Vault size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-slate-500 dark:text-slate-400 mb-2">Chưa có hũ chi tiêu nào</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Tạo hũ đầu tiên để bắt đầu phân bổ thu nhập</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <Plus size={16} /> Tạo hũ mới
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {jars.map((jar) => (
                  <JarCard
                    key={jar.id}
                    jar={jar}
                    totalBalance={totalBalance}
                    onClick={() => setSelectedJarId(jar.id)}
                    onEdit={() => setEditJar(jar)}
                    onDelete={() => setDeleteAlert({ show: true, id: jar.id })}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Modals ── */}
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Tạo hũ chi tiêu mới">
          <JarForm key="create-jar" onSave={handleCreateJar} onCancel={() => setShowAddModal(false)} />
        </Modal>

        <Modal isOpen={!!editJar} onClose={() => setEditJar(null)} title="Cập nhật hũ chi tiêu">
          <JarForm key={editJar?.id || "edit-jar"} initialData={editJar} isEditing jars={jars} onSave={handleUpdateJar} onCancel={() => setEditJar(null)} />
        </Modal>

        <Modal isOpen={deleteAlert.show} onClose={() => setDeleteAlert({ show: false, id: null })} title="Xoá hũ chi tiêu">
          <DeleteAlert
            content="Bạn có chắc muốn xoá hũ này không? Số dư trong hũ sẽ bị mất."
            onDelete={() => handleDeleteJar(deleteAlert.id)}
            onCancel={() => setDeleteAlert({ show: false, id: null })}
          />
        </Modal>

        {showTransferModal && (
          <JarTransferModal
            jars={jars}
            onTransfer={handleTransfer}
            onClose={() => setShowTransferModal(false)}
          />
        )}

        {/* ── Expense CRUD Modals ── */}
        <Modal isOpen={openAddExpenseModal} onClose={() => setOpenAddExpenseModal(false)} title="Thêm chi tiêu vào hũ">
          <AddExpenseForm onAddExpense={handleAddExpense} categories={categories} defaultJarId={selectedJar?.id} jars={jars} />
        </Modal>

        <Modal isOpen={openEditExpenseModal} onClose={() => { setOpenEditExpenseModal(false); setExpenseToEdit(null); }} title="Chỉnh sửa chi tiêu">
          {expenseToEdit && (
            <EditExpenseForm onUpdateExpense={handleUpdateExpense} categories={categories} expenseToEdit={expenseToEdit} jars={jars} />
          )}
        </Modal>

        <Modal isOpen={openDeleteExpenseAlert.show} onClose={() => setOpenDeleteExpenseAlert({ show: false, id: null })} title="Xóa chi tiêu">
          <DeleteAlert
            content="Bạn có chắc chắn muốn xóa chi tiêu này không?"
            onDelete={() => handleDeleteExpense(openDeleteExpenseAlert.id)}
            onCancel={() => setOpenDeleteExpenseAlert({ show: false, id: null })}
          />
        </Modal>
      </div>
    </Dashboard>
  );
};

export default Jars;

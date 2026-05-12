import Dashboard from "../components/Dashboard.jsx";
import { useUser } from "../hooks/useUser.jsx";
import { useContext, useEffect, useState } from "react";
import axiosConfig from "../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import toast from "react-hot-toast";
import { ChevronDown } from "lucide-react";
import IncomeList from "../components/IncomeList.jsx";
import Modal from "../components/Modal.jsx";
import AddIncomeForm from "../components/AddIncomeForm.jsx";
import DeleteAlert from "../components/DeleteAlert.jsx";
import IncomeOverview from "../components/IncomeOverview.jsx";
import { AppContext } from "../context/AppContext.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";

const Income = () => {
  useUser();
  usePageTitle("Thu nhập");
  const { user } = useContext(AppContext);
  const [incomeData, setIncomeData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("current");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [openAddIncomeModal, setOpenAddIncomeModal] = useState(false);
  const [openDeleteAlert, setOpenDeleteAlert] = useState({ show: false, data: null });

  const exportUpgradeMessage = "Tính năng xuất báo cáo chỉ có từ gói Cơ Bản. Vui lòng nâng cấp để tiếp tục.";
  const exportLocked = user?.canExportReports === false;

  const fetchIncomeDetails = async () => {
    if (loading) return;
    setLoading(true);
    try {
      let url = API_ENDPOINTS.GET_ALL_INCOMES;
      if (filterType === "all") url += "?all=true";
      else if (filterType === "specific" && selectedMonth) {
        const [year, month] = selectedMonth.split("-");
        url += `?month=${month}&year=${year}`;
      }
      const response = await axiosConfig.get(url);
      if (response.status === 200) setIncomeData(response.data);
    } catch (error) {
      console.error("Failed to fetch income details:", error);
      toast.error(error.response?.data?.message || "Lấy chi tiết thu nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomeCategories = async () => {
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.CATEGORY_BY_TYPE("income"));
      if (response.status === 200) setCategories(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Lấy danh mục thu nhập thất bại");
    }
  };

  const handleAddIncome = async (income) => {
    const { name, amount, date, icon, categoryId } = income;
    if (!name.trim()) { toast.error("Vui lòng nhập tên"); return; }
    if (!amount || isNaN(amount) || Number(amount) <= 0) { toast.error("Số tiền phải lớn hơn 0"); return; }
    if (!date) { toast.error("Vui lòng chọn ngày"); return; }
    const today = new Date().toISOString().split("T")[0];
    if (date > today) { toast.error("Date cannot be in the future"); return; }
    if (!categoryId) { toast.error("Vui lòng chọn danh mục"); return; }
    try {
      const response = await axiosConfig.post(API_ENDPOINTS.ADD_INCOME, { name, amount: Number(amount), date, icon, categoryId });
      if (response.status === 201) {
        setOpenAddIncomeModal(false);
        toast.success("Thêm thu nhập thành công");
        fetchIncomeDetails();
        fetchIncomeCategories();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Thêm thu nhập thất bại");
    }
  };

  const deleteIncome = async (id) => {
    try {
      await axiosConfig.delete(API_ENDPOINTS.DELETE_INCOME(id));
      setOpenDeleteAlert({ show: false, data: null });
      toast.success("Xóa thu nhập thành công");
      fetchIncomeDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || "Xóa thu nhập thất bại");
    }
  };

  const handleDownloadIncomeDetails = async () => {
    if (exportLocked) { toast.error(exportUpgradeMessage); return; }
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.INCOME_EXCEL_DOWNLOAD, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "income_details.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Tải xuống thành công");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to download income");
    }
  };

  const handleEmailIncomeDetails = async () => {
    if (exportLocked) { toast.error(exportUpgradeMessage); return; }
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.EMAIL_INCOME);
      if (response.status === 200) toast.success("Gửi email chi tiết thu nhập thành công");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to email income");
    }
  };

  useEffect(() => { fetchIncomeCategories(); }, []);
  useEffect(() => {
    if (filterType === "specific" && !selectedMonth) return;
    fetchIncomeDetails();
  }, [filterType, selectedMonth]);

  return (
    <Dashboard activeMenu="Income">
      <div className="space-y-6">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 rounded-2xl
          bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Khung thời gian</h3>
          <div className="flex gap-3 items-center">
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="form-input mt-0 py-2 px-3 pr-8 appearance-none cursor-pointer"
              >
                <option value="current" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">Tháng này</option>
                <option value="all" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">Tất cả thời gian</option>
                <option value="specific" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">Chọn tháng</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" />
            </div>
            {filterType === "specific" && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="form-input mt-0 py-2 px-3"
              />
            )}
          </div>
        </div>

        <IncomeOverview transactions={incomeData} onAddIncome={() => setOpenAddIncomeModal(true)} />

        <IncomeList
          transactions={incomeData}
          onDelete={(id) => setOpenDeleteAlert({ show: true, data: id })}
          onDownload={handleDownloadIncomeDetails}
          onEmail={handleEmailIncomeDetails}
          disableExportActions={exportLocked}
          disabledMessage={exportUpgradeMessage}
        />

        <Modal isOpen={openAddIncomeModal} onClose={() => setOpenAddIncomeModal(false)} title="Thêm thu nhập">
          <AddIncomeForm onAddIncome={(income) => handleAddIncome(income)} categories={categories} />
        </Modal>

        <Modal isOpen={openDeleteAlert.show} onClose={() => setOpenDeleteAlert({ show: false, data: null })} title="Xóa thu nhập">
          <DeleteAlert content="Bạn có chắc chắn muốn xóa chi tiết thu nhập này?" onDelete={() => deleteIncome(openDeleteAlert.data)} />
        </Modal>
      </div>
    </Dashboard>
  );
};

export default Income;

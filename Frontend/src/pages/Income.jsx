import Dashboard from "../components/Dashboard.jsx";
import { useUser } from "../hooks/useUser.jsx";
import { useCallback, useContext, useEffect, useState } from "react";
import axiosConfig from "../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import { safeOpenExternal } from "../util/safeNavigation.js";
import toast from "react-hot-toast";
import CustomSelect from "../components/CustomSelect.jsx";
import IncomeList from "../components/IncomeList.jsx";
import Modal from "../components/Modal.jsx";
import AddIncomeForm from "../components/AddIncomeForm.jsx";
import EditIncomeForm from "../components/EditIncomeForm.jsx";
import DeleteAlert from "../components/DeleteAlert.jsx";
import IncomeOverview from "../components/IncomeOverview.jsx";
import TransactionCalendar from "../components/TransactionCalendar.jsx";
import { AppContext } from "../context/AppContext.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";
import DateInput from "../components/DateInput.jsx";
import { getMonthFilterValue, getTodayIsoDate, isIsoDateAfter } from "../util/dateInput.js";

const Income = () => {
  useUser();
  usePageTitle("Thu nhập");
  const { user } = useContext(AppContext);
  const [incomeData, setIncomeData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterType] = useState("current");
  const [selectedMonthDate] = useState("");
  const [openAddIncomeModal, setOpenAddIncomeModal] = useState(false);
  const [openEditIncomeModal, setOpenEditIncomeModal] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => getTodayIsoDate());
  const handleSelectCalendarDate = (date) => {
    setSelectedCalendarDate(date);
    setOpenAddIncomeModal(true);
  };
  const [openDeleteAlert, setOpenDeleteAlert] = useState({ show: false, data: null });

  const exportUpgradeMessage = "Tính năng xuất báo cáo chỉ có từ gói Cơ Bản. Vui lòng nâng cấp để tiếp tục.";
  const exportLocked = user?.canExportReports === false;

  const fetchIncomeDetails = useCallback(async () => {
    try {
      let url = API_ENDPOINTS.GET_ALL_INCOMES;
      if (filterType === "all") url += "?all=true";
      else if (filterType === "specific" && selectedMonthDate) {
        const [year, month] = getMonthFilterValue(selectedMonthDate).split("-");
        url += `?month=${month}&year=${year}`;
      }
      const response = await axiosConfig.get(url);
      if (response.status === 200) setIncomeData(response.data);
    } catch (error) {
      console.error("Failed to fetch income details:", error);
      toast.error(error.response?.data?.message || "Lấy chi tiết thu nhập thất bại");
    }
  }, [filterType, selectedMonthDate]);

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
    const today = getTodayIsoDate();
    if (isIsoDateAfter(date, today)) { toast.error("Ngày không được chọn ở tương lai."); return; }
    if (!categoryId) { toast.error("Vui lòng chọn danh mục"); return; }
    try {
      const payload = { name, amount: Number(amount), date, icon, categoryId };
      if (income.allocations && income.allocations.length > 0) {
        payload.allocations = income.allocations;
      }
      const response = await axiosConfig.post(API_ENDPOINTS.ADD_INCOME, payload);
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

  const handleUpdateIncome = async (id, updatedData) => {
    const { name, amount, date, icon, categoryId } = updatedData;
    if (!name.trim()) { toast.error("Vui lòng nhập tên"); return; }
    if (!amount || isNaN(amount) || Number(amount) <= 0) { toast.error("Số tiền phải lớn hơn 0"); return; }
    if (!date) { toast.error("Vui lòng chọn ngày"); return; }
    const today = getTodayIsoDate();
    if (isIsoDateAfter(date, today)) { toast.error("Ngày không được chọn ở tương lai."); return; }
    if (!categoryId) { toast.error("Vui lòng chọn danh mục"); return; }
    try {
      const payload = { name, amount: Number(amount), date, icon, categoryId };
      if (updatedData.allocations && updatedData.allocations.length > 0) {
        payload.allocations = updatedData.allocations;
      }
      const response = await axiosConfig.put(API_ENDPOINTS.UPDATE_INCOME(id), payload);
      if (response.status === 200) {
        setOpenEditIncomeModal(false);
        setSelectedIncome(null);
        toast.success("Cập nhật thu nhập thành công");
        fetchIncomeDetails();
        fetchIncomeCategories();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Cập nhật thu nhập thất bại");
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
      const now = new Date();
      let payload = { month: now.getMonth() + 1, year: now.getFullYear() };
      
      if (filterType === "specific" && selectedMonthDate) {
        const [year, month] = getMonthFilterValue(selectedMonthDate).split("-");
        payload = { month: Number(month), year: Number(year) };
      }

      const response = await axiosConfig.post(API_ENDPOINTS.GENERATE_INCOME_REPORT, payload);
      
      if (response.data && response.data.presignedUrl && safeOpenExternal(response.data.presignedUrl)) {
        toast.success("Đã mở link tải báo cáo Excel!");
      } else {
        throw new Error("Không lấy được link tải báo cáo");
      }
    } catch (error) {
      if (error.response?.status === 429) {
        // Blob is used, so we need to parse the JSON error
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result);
            toast.error(data.message || "Bạn thao tác quá nhanh.");
          } catch {
            toast.error("Bạn đã bị giới hạn tính năng này.");
          }
        };
        reader.readAsText(error.response.data);
      } else {
        toast.error(error.response?.data?.message || "Lỗi khi tải báo cáo Excel.");
      }
    }
  };

  const handleEmailIncomeDetails = async () => {
    if (exportLocked) { toast.error(exportUpgradeMessage); return; }
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.EMAIL_INCOME);
      if (response.status === 200) toast.success("Gửi email chi tiết thu nhập thành công");
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi gửi email báo cáo.");
    }
  };

  useEffect(() => { fetchIncomeCategories(); }, []);
  useEffect(() => {
    if (filterType === "specific" && !selectedMonthDate) return;
    fetchIncomeDetails();
  }, [fetchIncomeDetails, filterType, selectedMonthDate]);

  return (
    <Dashboard activeMenu="Income">
      <div className="space-y-4 sm:space-y-6">

        <IncomeOverview onAddIncome={() => setOpenAddIncomeModal(true)} />

        <TransactionCalendar
          key={`income-calendar-${filterType}-${selectedMonthDate || "current"}`}
          transactions={incomeData}
          type="income"
          initialMonth={filterType === "specific" && selectedMonthDate ? selectedMonthDate : undefined}
          onEdit={(income) => { setSelectedIncome(income); setOpenEditIncomeModal(true); }}
          onDelete={(id) => setOpenDeleteAlert({ show: true, data: id })}
          onSelectDate={handleSelectCalendarDate}
        />

        <IncomeList
          transactions={incomeData}
          onDelete={(id) => setOpenDeleteAlert({ show: true, data: id })}
          onEdit={(income) => { setSelectedIncome(income); setOpenEditIncomeModal(true); }}
          onDownload={handleDownloadIncomeDetails}
          onEmail={handleEmailIncomeDetails}
          disableExportActions={exportLocked}
          disabledMessage={exportUpgradeMessage}
        />

        <Modal isOpen={openAddIncomeModal} onClose={() => setOpenAddIncomeModal(false)} title="Thêm thu nhập">
          <AddIncomeForm onAddIncome={(income) => handleAddIncome(income)} categories={categories} initialDate={selectedCalendarDate} />
        </Modal>

        <Modal isOpen={openEditIncomeModal} onClose={() => { setOpenEditIncomeModal(false); setSelectedIncome(null); }} title="Chỉnh sửa thu nhập">
          {selectedIncome && (
            <EditIncomeForm
              onUpdateIncome={handleUpdateIncome}
              categories={categories}
              incomeData={selectedIncome}
            />
          )}
        </Modal>

        <Modal isOpen={openDeleteAlert.show} onClose={() => setOpenDeleteAlert({ show: false, data: null })} title="Xóa thu nhập">
          <DeleteAlert 
            content="Bạn có chắc chắn muốn xóa chi tiết thu nhập này?" 
            onDelete={() => deleteIncome(openDeleteAlert.data)} 
            onCancel={() => setOpenDeleteAlert({ show: false, data: null })}
          />
        </Modal>
      </div>
    </Dashboard>
  );
};

export default Income;

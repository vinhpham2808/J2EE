import { useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { LoaderCircle, Trash2, ChevronDown } from "lucide-react";
import { AppContext } from "../context/AppContext.jsx";
import { useUser } from "../hooks/useUser.jsx";
import axiosConfig from "../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import Dashboard from "../components/Dashboard.jsx";
import ExpenseOverview from "../components/ExpenseOverview.jsx";
import ExpenseList from "../components/ExpenseList.jsx";
import Modal from "../components/Modal.jsx";
import AddExpenseForm from "../components/AddExpenseForm.jsx";
import DeleteAlert from "../components/DeleteAlert.jsx";
import QuickExpenseTemplates from "../components/QuickExpenseTemplates.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";

const Expense = () => {
  useUser();
  usePageTitle("Chi tiêu");
  const { user } = useContext(AppContext);
  const [expenseData, setExpenseData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openAddExpenseModal, setOpenAddExpenseModal] = useState(false);
  const [openDeleteAlert, setOpenDeleteAlert] = useState({ show: false, data: null });
  const [isImportingReceipt, setIsImportingReceipt] = useState(false);
  const [isConfirmingImport, setIsConfirmingImport] = useState(false);
  const [openReceiptPreviewModal, setOpenReceiptPreviewModal] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const receiptFileInputRef = useRef(null);

  const exportUpgradeMessage = "Nâng cấp gói để sử dụng tính năng này";
  const exportLocked = user?.canExportReports === false;
  const receiptImportLocked = user?.canImportReceipt === false;
  const receiptImportUpgradeMessage = "Tính năng kiểm tra hoá đơn bằng ảnh chỉ có ở gói Premium. Vui lòng nâng cấp để tiếp tục";

  const fetchExpenseDetails = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await axiosConfig.get(`${API_ENDPOINTS.GET_ALL_EXPENSE}`);
      if (response.data) setExpenseData(response.data);
    } catch (error) {
      console.error("Failed to fetch expense details:", error);
      toast.error("Không thể tải chi tiết chi tiêu.");
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenseCategories = async () => {
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.CATEGORY_BY_TYPE("expense"));
      if (response.data) { setCategories(response.data); return response.data; }
      return [];
    } catch (error) {
      console.error("Failed to fetch expense categories:", error);
      toast.error("Không thể tải danh mục chi tiêu.");
      return [];
    }
  };

  const handleAddExpense = async (expense) => {
    const { name, categoryId, amount, date, icon } = expense;
    if (!name.trim()) { toast.error("Vui lòng nhập tên chi tiêu."); return; }
    if (!categoryId) { toast.error("Vui lòng chọn danh mục."); return; }
    if (!amount || isNaN(amount) || Number(amount) <= 0) { toast.error("Số tiền phải lớn hơn 0."); return; }
    if (!date) { toast.error("Vui lòng chọn ngày."); return; }
    const today = new Date().toISOString().split("T")[0];
    if (date > today) { toast.error("Ngày không được chọn ở tương lai."); return; }

    try {
      const response = await axiosConfig.post(API_ENDPOINTS.ADD_EXPENSE, { name, categoryId, amount: Number(amount), date, icon });
      setOpenAddExpenseModal(false);
      toast.success("Thêm chi tiêu thành công");
      const budgetStatus = response.data?.budgetStatus;
      if (budgetStatus?.hasBudget) {
        const fmt = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
        const pct = (budgetStatus.usageRatio * 100).toFixed(1);
        if (budgetStatus.isExceeded) {
          toast.error(`🚨 Vượt hạn mức "${budgetStatus.categoryName}"!\nĐã chi ${fmt(budgetStatus.totalSpent)} / ${fmt(budgetStatus.amountLimit)} (${pct}%)`, { duration: 6000 });
        } else if (budgetStatus.isWarning) {
          toast(`⚠️ Sắp hết hạn mức "${budgetStatus.categoryName}"\nĐã chi ${fmt(budgetStatus.totalSpent)} / ${fmt(budgetStatus.amountLimit)} (${pct}%)`,
            { icon: "⚠️", duration: 5000, style: { background: "#f39c12", color: "#fff" } });
        }
      }
      fetchExpenseDetails();
      fetchExpenseCategories();
    } catch (error) {
      console.error("Error adding expense:", error.response?.data?.message || error.message);
      toast.error(error.response?.data?.message || "Không thể thêm chi tiêu.");
    }
  };

  const deleteExpense = async (id) => {
    try {
      await axiosConfig.delete(API_ENDPOINTS.DELETE_EXPENSE(id));
      setOpenDeleteAlert({ show: false, data: null });
      toast.success("Xóa chi tiêu thành công.");
      fetchExpenseDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể xóa chi tiêu.");
    }
  };

  const handleDownloadExpenseDetails = async () => {
    if (exportLocked) { toast.error(exportUpgradeMessage); return; }
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.EXPENSE_EXCEL_DOWNLOAD, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "expense_details.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Đã tải báo cáo Excel về máy!");
    } catch (error) {
      if (error.response?.status === 429) {
        // Blob is used, so we need to parse the JSON error
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result);
            toast.error(data.message || "Bạn thao tác quá nhanh.");
          } catch (e) {
            toast.error("Bạn đã bị giới hạn tính năng này.");
          }
        };
        reader.readAsText(error.response.data);
      } else {
        toast.error(error.response?.data?.message || "Lỗi khi tải báo cáo Excel.");
      }
    }
  };

  const handleEmailExpenseDetails = async () => {
    if (exportLocked) { toast.error(exportUpgradeMessage); return; }
    const loadingToast = toast.loading("Đang tạo và gửi báo cáo qua Email...");
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.EMAIL_EXPENSE);
      toast.dismiss(loadingToast);
      if (response.status === 200) toast.success("Đã gửi Email thành công!");
    } catch (e) {
      toast.dismiss(loadingToast);
      toast.error(e.response?.data?.message || "Lỗi khi gửi email báo cáo.");
    }
  };

  const handleOpenReceiptPicker = () => {
    if (receiptImportLocked) { toast.error(receiptImportUpgradeMessage); return; }
    receiptFileInputRef.current?.click();
  };

  const handleImportReceipt = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith("image/")) { toast.error("Vui lòng chọn tệp ảnh hóa đơn."); event.target.value = ""; return; }
    const formData = new FormData();
    formData.append("file", file);
    setIsImportingReceipt(true);
    try {
      const response = await axiosConfig.post(API_ENDPOINTS.ANALYZE_EXPENSE_RECEIPT, formData, { headers: { "Content-Type": "multipart/form-data" } });
      const detectedCount = Number(response.data?.items?.length || 0);
      if (detectedCount <= 0) { toast.error("Không phát hiện được dòng chi tiêu hợp lệ trên hóa đơn."); return; }
      await fetchExpenseCategories();
      setReceiptPreview({
        merchant: response.data?.merchant || "",
        location: response.data?.location || "",
        receiptDate: response.data?.receiptDate || new Date().toISOString().split("T")[0],
        items: (response.data?.items || []).map((item) => ({
          name: item?.name || "", amount: item?.amount ?? "", categoryId: item?.categoryId ?? "",
          icon: item?.icon || "", date: item?.date || response.data?.receiptDate || new Date().toISOString().split("T")[0],
        })),
      });
      setOpenReceiptPreviewModal(true);
      toast.success(`Đã quét ${detectedCount} sản phẩm. Vui lòng kiểm tra trước khi lưu.`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể import hóa đơn.");
    } finally {
      setIsImportingReceipt(false);
      event.target.value = "";
    }
  };

  const handlePreviewFieldChange = (key, value) => setReceiptPreview((prev) => prev ? { ...prev, [key]: value } : prev);
  const handlePreviewItemChange = (index, key, value) => setReceiptPreview((prev) => {
    if (!prev) return prev;
    const nextItems = [...prev.items];
    nextItems[index] = { ...nextItems[index], [key]: value };
    return { ...prev, items: nextItems };
  });
  const handleRemovePreviewItem = (index) => setReceiptPreview((prev) => prev ? { ...prev, items: prev.items.filter((_, i) => i !== index) } : prev);
  const handleCloseReceiptPreview = () => { if (isConfirmingImport) return; setOpenReceiptPreviewModal(false); setReceiptPreview(null); };

  const handleConfirmReceiptImport = async () => {
    if (!receiptPreview) return;
    const cleanedItems = (receiptPreview.items || [])
      .map((item) => ({ name: String(item.name || "").trim(), amount: Number(item.amount || 0), categoryId: Number(item.categoryId), icon: item.icon || "", date: item.date || receiptPreview.receiptDate }))
      .filter((item) => item.name && item.amount > 0 && Number.isFinite(item.categoryId));
    if (cleanedItems.length === 0) { toast.error("Danh sách import không hợp lệ. Vui lòng kiểm tra lại sản phẩm."); return; }
    setIsConfirmingImport(true);
    try {
      const response = await axiosConfig.post(API_ENDPOINTS.CONFIRM_EXPENSE_RECEIPT_IMPORT, {
        merchant: receiptPreview.merchant || "", location: receiptPreview.location || "",
        receiptDate: receiptPreview.receiptDate || null, items: cleanedItems,
      });
      const importedCount = Number(response.data?.importedCount || 0);
      toast.success(`Đã lưu ${importedCount} khoản chi từ hóa đơn.`);
      setOpenReceiptPreviewModal(false);
      setReceiptPreview(null);
      fetchExpenseDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể lưu dữ liệu hóa đơn.");
    } finally {
      setIsConfirmingImport(false);
    }
  };

  useEffect(() => { fetchExpenseDetails(); fetchExpenseCategories(); }, []);

  const inputCls = "w-full rounded-xl px-3 py-2 text-sm outline-none transition-colors bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-violet-500 dark:focus:border-amber-500";

  return (
    <Dashboard activeMenu="Expense">
      <div className="space-y-6">
        <ExpenseOverview
          transactions={expenseData}
          onExpenseIncome={() => setOpenAddExpenseModal(true)}
          onImportReceipt={handleOpenReceiptPicker}
          isImportingReceipt={isImportingReceipt}
        />
        <input ref={receiptFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImportReceipt} disabled={isImportingReceipt} />

        {/* Quick Expense Templates */}
        <QuickExpenseTemplates
          categories={categories}
          onAddExpense={handleAddExpense}
        />

        <ExpenseList
          transactions={expenseData}
          onDelete={(id) => setOpenDeleteAlert({ show: true, data: id })}
          onDownload={handleDownloadExpenseDetails}
          onEmail={handleEmailExpenseDetails}
          disableExportActions={exportLocked}
          disabledMessage={exportUpgradeMessage}
        />

        <Modal isOpen={openAddExpenseModal} onClose={() => setOpenAddExpenseModal(false)} title="Thêm chi tiêu">
          <AddExpenseForm onAddExpense={handleAddExpense} categories={categories} />
        </Modal>

        <Modal isOpen={openDeleteAlert.show} onClose={() => setOpenDeleteAlert({ show: false, data: null })} title="Xóa chi tiêu">
          <DeleteAlert content="Bạn có chắc chắn muốn xóa chi tiêu này không?" onDelete={() => deleteExpense(openDeleteAlert.data)} />
        </Modal>

        {/* Receipt Preview Modal */}
        <Modal isOpen={openReceiptPreviewModal} onClose={handleCloseReceiptPreview} title="Hóa đơn">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Cửa hàng</label>
                <input className={inputCls} value={receiptPreview?.merchant || ""} onChange={(e) => handlePreviewFieldChange("merchant", e.target.value)} placeholder="Tên cửa hàng" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Địa điểm</label>
                <input className={inputCls} value={receiptPreview?.location || ""} onChange={(e) => handlePreviewFieldChange("location", e.target.value)} placeholder="Số nhà, đường, quận..." />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Ngày hóa đơn</label>
              <input type="date" className={`${inputCls} md:w-60`} value={receiptPreview?.receiptDate || ""} onChange={(e) => handlePreviewFieldChange("receiptDate", e.target.value)} />
            </div>

            <div className="space-y-2.5">
              {(receiptPreview?.items || []).map((item, index) => (
                <div key={index} className="rounded-xl border border-slate-200 dark:border-white/10 p-3 bg-slate-50 dark:bg-white/3">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                    <div className="md:col-span-4">
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Tên sản phẩm</label>
                      <input className={inputCls} value={item.name || ""} onChange={(e) => handlePreviewItemChange(index, "name", e.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Số tiền</label>
                      <input type="number" min="0" className={inputCls} value={item.amount ?? ""} onChange={(e) => handlePreviewItemChange(index, "amount", e.target.value)} />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Danh mục</label>
                      <div className="relative">
                        <select className={`${inputCls} appearance-none pr-8 cursor-pointer`} value={item.categoryId ?? ""} onChange={(e) => handlePreviewItemChange(index, "categoryId", e.target.value)}>
                          <option value="" className="text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800">Chọn danh mục</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{category.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Ngày</label>
                      <input type="date" className={inputCls} value={item.date || receiptPreview?.receiptDate || ""} onChange={(e) => handlePreviewItemChange(index, "date", e.target.value)} />
                    </div>
                    <div className="md:col-span-1 flex md:justify-end">
                      <button type="button" className="rounded-xl border border-red-200 dark:border-red-500/30 px-2 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" onClick={() => handleRemovePreviewItem(index)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
              <button type="button" className="rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-60" onClick={handleCloseReceiptPreview} disabled={isConfirmingImport}>
                Hủy
              </button>
              <button type="button" className="rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 transition-all active:scale-95" onClick={handleConfirmReceiptImport} disabled={isConfirmingImport}>
                {isConfirmingImport ? (
                  <span className="inline-flex items-center gap-2"><LoaderCircle size={15} className="animate-spin" />Đang lưu...</span>
                ) : "Xác nhận lưu vào chi tiêu"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Dashboard>
  );
};

export default Expense;

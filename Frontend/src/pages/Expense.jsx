import { useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, FileText, LoaderCircle, Trash2 } from "lucide-react";
import CustomSelect from "../components/CustomSelect.jsx";
import { AppContext } from "../context/AppContext.jsx";
import { useUser } from "../hooks/useUser.jsx";
import axiosConfig from "../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import Dashboard from "../components/Dashboard.jsx";
import ExpenseOverview from "../components/ExpenseOverview.jsx";
import ExpenseList from "../components/ExpenseList.jsx";
import Modal from "../components/Modal.jsx";
import AddExpenseForm from "../components/AddExpenseForm.jsx";
import EditExpenseForm from "../components/EditExpenseForm.jsx";
import DeleteAlert from "../components/DeleteAlert.jsx";
import QuickExpenseTemplates from "../components/QuickExpenseTemplates.jsx";
import TransactionCalendar from "../components/TransactionCalendar.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";
import DateInput from "../components/DateInput.jsx";
import { getTodayIsoDate, isIsoDateAfter, normalizeToIsoDate } from "../util/dateInput.js";

const Expense = () => {
  useUser();
  usePageTitle("Chi tiêu");
  const { user } = useContext(AppContext);
  const [expenseData, setExpenseData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [openAddExpenseModal, setOpenAddExpenseModal] = useState(false);
  const [openEditExpenseModal, setOpenEditExpenseModal] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => getTodayIsoDate());
  const handleSelectCalendarDate = (date) => {
    setSelectedCalendarDate(date);
    setOpenAddExpenseModal(true);
  };
  const [openDeleteAlert, setOpenDeleteAlert] = useState({ show: false, data: null });
  const [isImportingReceipt, setIsImportingReceipt] = useState(false);
  const [isConfirmingImport, setIsConfirmingImport] = useState(false);
  const [openReceiptPreviewModal, setOpenReceiptPreviewModal] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [jars, setJars] = useState([]);
  const [openFormatInfoModal, setOpenFormatInfoModal] = useState(false);
  const receiptFileInputRef = useRef(null);

  const exportUpgradeMessage = "Nâng cấp gói để sử dụng tính năng này";
  const exportLocked = user?.canExportReports === false;
  const receiptImportLocked = user?.canImportReceipt === false;
  const receiptImportUpgradeMessage = "Tính năng kiểm tra hoá đơn bằng ảnh chỉ có ở gói Premium. Vui lòng nâng cấp để tiếp tục";

  const fetchExpenseDetails = async () => {
    try {
      const response = await axiosConfig.get(`${API_ENDPOINTS.GET_ALL_EXPENSE}?all=true`);
      if (response.data) setExpenseData(response.data);
    } catch (error) {
      console.error("Failed to fetch expense details:", error);
      toast.error(error.response?.data?.message || "Không thể tải chi tiết chi tiêu.");
    }
  };

  const fetchJars = async () => {
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.GET_JARS);
      if (response.data) setJars(response.data);
    } catch {
      // jars are optional — silently ignore
    }
  };

  const fetchExpenseCategories = async () => {
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.CATEGORY_BY_TYPE("expense"));
      if (response.data) { setCategories(response.data); return response.data; }
      return [];
    } catch (error) {
      console.error("Failed to fetch expense categories:", error);
      toast.error(error.response?.data?.message || "Không thể tải danh mục chi tiêu.");
      return [];
    }
  };

  const handleAddExpense = async (expense) => {
    const { name, categoryId, amount, date, icon, jarId } = expense;
    if (!name.trim()) { toast.error("Vui lòng nhập tên chi tiêu."); return; }
    if (!categoryId) { toast.error("Vui lòng chọn danh mục."); return; }
    if (!amount || isNaN(amount) || Number(amount) <= 0) { toast.error("Số tiền phải lớn hơn 0."); return; }
    if (!date) { toast.error("Vui lòng chọn ngày."); return; }
    const today = getTodayIsoDate();
    if (isIsoDateAfter(date, today)) { toast.error("Ngày không được chọn ở tương lai."); return; }

    try {
      const response = await axiosConfig.post(API_ENDPOINTS.ADD_EXPENSE, { name, categoryId, amount: Number(amount), date, icon, jarId });
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

  const handleUpdateExpense = async (expense) => {
    const { id, name, categoryId, amount, date, icon, jarId } = expense;
    if (!name.trim()) { toast.error("Vui lòng nhập tên chi tiêu."); return; }
    if (!categoryId) { toast.error("Vui lòng chọn danh mục."); return; }
    if (!amount || isNaN(amount) || Number(amount) <= 0) { toast.error("Số tiền phải lớn hơn 0."); return; }
    if (!date) { toast.error("Vui lòng chọn ngày."); return; }
    const today = getTodayIsoDate();
    if (isIsoDateAfter(date, today)) { toast.error("Ngày không được chọn ở tương lai."); return; }

    try {
      const response = await axiosConfig.put(API_ENDPOINTS.UPDATE_EXPENSE(id), { name, categoryId, amount: Number(amount), date, icon, jarId });
      setOpenEditExpenseModal(false);
      setExpenseToEdit(null);
      toast.success("Cập nhật chi tiêu thành công");
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
      console.error("Error updating expense:", error.response?.data?.message || error.message);
      toast.error(error.response?.data?.message || "Không thể cập nhật chi tiêu.");
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

  const handleEmailExpenseDetails = async () => {
    if (exportLocked) { toast.error(exportUpgradeMessage); return; }
    const loadingToast = toast.loading("Đang tạo và gửi báo cáo qua Email...");
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.EMAIL_EXPENSE);
      toast.dismiss(loadingToast);
      if (response.status === 200) toast.success("Đã gửi Email thành công!");
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.message || "Lỗi khi gửi email báo cáo.");
    }
  };

  const handleOpenReceiptPicker = () => {
    if (receiptImportLocked) { toast.error(receiptImportUpgradeMessage); return; }
    receiptFileInputRef.current?.click();
  };

  const handleImportReceipt = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // UX-only: browser-provided, backend enforces
    if (!file.type?.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Vui lòng chọn tệp ảnh hoặc PDF.");
      event.target.value = "";
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setIsImportingReceipt(true);
    try {
      const response = await axiosConfig.post(API_ENDPOINTS.ANALYZE_EXPENSE_RECEIPT, formData, { headers: { "Content-Type": "multipart/form-data" } });
      const detectedCount = Number(response.data?.items?.length || 0);
      if (detectedCount <= 0) { toast.error("Không phát hiện được dòng chi tiêu hợp lệ trên hóa đơn."); return; }
      await Promise.all([fetchExpenseCategories(), fetchJars()]);
      setReceiptPreview({
        merchant: response.data?.merchant || "",
        location: response.data?.location || "",
        receiptDate: normalizeToIsoDate(response.data?.receiptDate) || getTodayIsoDate(),
        jarId: "",
        items: (response.data?.items || []).map((item) => ({
          name: item?.name || "", amount: item?.amount ?? "", categoryId: item?.categoryId ?? "",
          icon: item?.icon || "", date: normalizeToIsoDate(item?.date) || normalizeToIsoDate(response.data?.receiptDate) || getTodayIsoDate(),
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
      .map((item) => ({ name: String(item.name || "").trim(), amount: Number(item.amount || 0), categoryId: item.categoryId ? Number(item.categoryId) : null, icon: item.icon || "", date: item.date || receiptPreview.receiptDate }))
      .filter((item) => item.name && item.amount > 0);
    if (cleanedItems.length === 0) { toast.error("Danh sách import không hợp lệ. Vui lòng kiểm tra lại sản phẩm."); return; }
    setIsConfirmingImport(true);
    try {
      const response = await axiosConfig.post(API_ENDPOINTS.CONFIRM_EXPENSE_RECEIPT_IMPORT, {
        merchant: receiptPreview.merchant || "", location: receiptPreview.location || "",
        receiptDate: receiptPreview.receiptDate || null,
        jarId: receiptPreview.jarId ? Number(receiptPreview.jarId) : null,
        items: cleanedItems,
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

  useEffect(() => { fetchExpenseDetails(); fetchExpenseCategories(); fetchJars(); }, []);

  const inputCls = "w-full rounded-xl px-3 py-2 text-sm outline-none transition-colors bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-violet-500 dark:focus:border-amber-500";

  return (
    <Dashboard activeMenu="Expense">
      <div className="space-y-4 sm:space-y-6">
        <ExpenseOverview
          onExpenseIncome={() => setOpenAddExpenseModal(true)}
          onImportReceipt={handleOpenReceiptPicker}
          isImportingReceipt={isImportingReceipt}
          onOpenFormatInfo={() => setOpenFormatInfoModal(true)}
        />
        <input ref={receiptFileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleImportReceipt} disabled={isImportingReceipt} />

        <TransactionCalendar
          transactions={expenseData}
          type="expense"
          onEdit={(exp) => { setExpenseToEdit(exp); setOpenEditExpenseModal(true); }}
          onDelete={(id) => setOpenDeleteAlert({ show: true, data: id })}
          onSelectDate={handleSelectCalendarDate}
        />

        {/* Quick Expense Templates */}
        <QuickExpenseTemplates
          categories={categories}
          onAddExpense={handleAddExpense}
        />

        <ExpenseList
          transactions={expenseData}
          onDelete={(id) => setOpenDeleteAlert({ show: true, data: id })}
          onEdit={(exp) => { setExpenseToEdit(exp); setOpenEditExpenseModal(true); }}
          onDownload={handleDownloadExpenseDetails}
          onEmail={handleEmailExpenseDetails}
          disableExportActions={exportLocked}
          disabledMessage={exportUpgradeMessage}
        />

        <Modal isOpen={openAddExpenseModal} onClose={() => setOpenAddExpenseModal(false)} title="Thêm chi tiêu">
          <AddExpenseForm onAddExpense={handleAddExpense} categories={categories} jars={jars} initialDate={selectedCalendarDate} />
        </Modal>

        <Modal isOpen={openEditExpenseModal} onClose={() => { setOpenEditExpenseModal(false); setExpenseToEdit(null); }} title="Chỉnh sửa chi tiêu">
          {expenseToEdit && (
            <EditExpenseForm onUpdateExpense={handleUpdateExpense} categories={categories} expenseToEdit={expenseToEdit} jars={jars} />
          )}
        </Modal>

        <Modal isOpen={openDeleteAlert.show} onClose={() => setOpenDeleteAlert({ show: false, data: null })} title="Xóa chi tiêu">
          <DeleteAlert 
            content="Bạn có chắc chắn muốn xóa chi tiêu này không?" 
            onDelete={() => deleteExpense(openDeleteAlert.data)} 
            onCancel={() => setOpenDeleteAlert({ show: false, data: null })}
          />
        </Modal>

        {/* Format Info Modal */}
        <Modal isOpen={openFormatInfoModal} onClose={() => setOpenFormatInfoModal(false)} title="Định dạng tệp hỗ trợ">
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Tính năng kiểm tra hóa đơn hỗ trợ các định dạng sau:
            </p>
            <ul className="space-y-2">
              {[
                { ext: "JPEG / JPG", desc: "Ảnh chụp hóa đơn phổ biến nhất" },
                { ext: "PNG",        desc: "Ảnh chụp màn hình hoặc scan" },
                { ext: "WEBP",       desc: "Ảnh web nén nhỏ" },
                { ext: "GIF",        desc: "Ảnh tĩnh định dạng GIF" },
                { ext: "PDF",        desc: "Hóa đơn điện tử hoặc scan" },
              ].map(({ ext, desc }) => (
                <li key={ext} className="flex items-start gap-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 px-4 py-2.5">
                  <FileText size={16} className="mt-0.5 shrink-0 text-violet-500 dark:text-amber-400" />
                  <div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">{ext}</span>
                    <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">{desc}</span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Kích thước tệp tối đa: <span className="font-medium text-slate-600 dark:text-slate-300">10 MB</span>
            </p>
          </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Ngày hóa đơn</label>
                <DateInput className={inputCls} value={receiptPreview?.receiptDate || ""} onChange={(e) => handlePreviewFieldChange("receiptDate", e.target.value)} />
              </div>
              {jars.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Trừ từ hũ</label>
                  <CustomSelect
                    value={receiptPreview?.jarId ?? ""}
                    onChange={(e) => handlePreviewFieldChange("jarId", e.target.value)}
                    options={[
                      { value: "", label: "Chọn hũ thanh toán" },
                      ...jars.map((j) => ({
                        value: j.id,
                        label: `🏦 ${j.name?.trim() || "Hũ không tên"} — ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(j.currentBalance ?? 0)}`,
                      })),
                    ]}
                    className={inputCls}
                  />
                  {(() => {
                    const selectedJar = jars.find((j) => String(j.id) === String(receiptPreview?.jarId));
                    const totalAmount = (receiptPreview?.items || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
                    if (selectedJar && totalAmount > (selectedJar.currentBalance ?? 0)) {
                      return (
                        <div className="flex items-center gap-1.5 mt-1 px-1">
                          <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            Số dư hũ không đủ ({new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(selectedJar.currentBalance)})
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
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
                      <CustomSelect
                        value={item.categoryId ?? ""}
                        onChange={(e) => handlePreviewItemChange(index, "categoryId", e.target.value)}
                        options={[
                          { value: "", label: "Chọn danh mục" },
                          ...categories.map((c) => ({ value: c.id, label: c.name })),
                        ]}
                        className={inputCls}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Ngày</label>
                      <DateInput className={inputCls} value={item.date || receiptPreview?.receiptDate || ""} onChange={(e) => handlePreviewItemChange(index, "date", e.target.value)} />
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
              <button type="button" className="rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 transition transform-gpu active:scale-95" onClick={handleConfirmReceiptImport} disabled={isConfirmingImport}>
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

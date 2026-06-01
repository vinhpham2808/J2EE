import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useUser } from "../hooks/useUser.jsx";
import axiosConfig from "../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import Dashboard from "../components/Dashboard.jsx";
import BudgetList from "../components/BudgetList.jsx";
import BudgetForm from "../components/BudgetForm.jsx";
import Modal from "../components/Modal.jsx";
import DeleteAlert from "../components/DeleteAlert.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";

/**
 * Budget Page – Trang quản lý hạn mức ngân sách
 * Tích hợp 3 luồng: Thiết lập, Kiểm tra (qua API), Cảnh báo (email async)
 */
const Budget = () => {
    useUser();
    usePageTitle("Ngân sách");

    const [budgets, setBudgets]               = useState([]);
    const [categories, setCategories]         = useState([]);
    const [loading, setLoading]               = useState(false);
    const [showAddModal, setShowAddModal]     = useState(false);
    const [deleteAlert, setDeleteAlert]       = useState({ show: false, id: null });

    // ─── Fetch dữ liệu ───────────────────────────────────────────
    const fetchBudgets = async () => {
        setLoading(true);
        try {
            const res = await axiosConfig.get(API_ENDPOINTS.GET_BUDGETS);
            if (res.data) setBudgets(res.data);
        } catch (err) {
            console.error("Lỗi tải hạn mức:", err);
            toast.error("Không thể tải danh sách hạn mức.");
        } finally {
            setLoading(false);
        }
    };

    const fetchExpenseCategories = async () => {
        try {
            const res = await axiosConfig.get(API_ENDPOINTS.CATEGORY_BY_TYPE("expense"));
            if (res.data) setCategories(res.data);
        } catch (err) {
            console.error("Lỗi tải danh mục:", err);
        }
    };

    useEffect(() => {
        fetchBudgets();
        fetchExpenseCategories();
    }, []);

    // ─── Thiết lập / Lưu hạn mức ────────────────────────────────
    const handleSaveBudget = async (dto) => {
        try {
            await axiosConfig.post(API_ENDPOINTS.SET_BUDGET, dto);
            toast.success("Lưu hạn mức thành công!");
            setShowAddModal(false);
            fetchBudgets();
        } catch (err) {
            console.error("Lỗi lưu hạn mức:", err);
            toast.error(
                err.response?.data?.message || "Không thể lưu hạn mức. Vui lòng thử lại."
            );
        }
    };

    // ─── Xóa hạn mức ────────────────────────────────────────────
    const handleDeleteBudget = async (id) => {
        try {
            await axiosConfig.delete(API_ENDPOINTS.DELETE_BUDGET(id));
            toast.success("Đã xóa hạn mức.");
            setDeleteAlert({ show: false, id: null });
            fetchBudgets();
        } catch (err) {
            console.error("Lỗi xóa hạn mức:", err);
            toast.error(
                err.response?.data?.message || "Không thể xóa hạn mức. Vui lòng thử lại."
            );
        }
    };

    return (
        <Dashboard activeMenu="Budget">
            <div className="my-5 mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                            Hạn mức ngân sách
                        </h2>
                        <p className="mt-1 text-slate-500 dark:text-slate-400">
                            Thiết lập giới hạn chi tiêu và theo dõi cảnh báo vượt mức
                        </p>
                    </div>
                </div>

                {/* ── Budget List ── */}
                <BudgetList
                    budgets={budgets}
                    loading={loading}
                    onDelete={(id) => setDeleteAlert({ show: true, id })}
                    onAddClick={() => setShowAddModal(true)}
                />

                {/* ── Add/Edit Budget Modal ── */}
                <Modal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    title="Thiết lập hạn mức ngân sách"
                >
                    <BudgetForm
                        categories={categories}
                        onSave={handleSaveBudget}
                        onCancel={() => setShowAddModal(false)}
                    />
                </Modal>

                {/* ── Delete Confirmation Modal ── */}
                <Modal
                    isOpen={deleteAlert.show}
                    onClose={() => setDeleteAlert({ show: false, id: null })}
                    title="Xóa hạn mức"
                >
                    <DeleteAlert
                        content="Bạn có chắc muốn xóa hạn mức này không?"
                        onDelete={() => handleDeleteBudget(deleteAlert.id)}
                        onCancel={() => setDeleteAlert({ show: false, id: null })}
                    />
                </Modal>
            </div>
        </Dashboard>
    );
};

export default Budget;

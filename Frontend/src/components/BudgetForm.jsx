import { useState } from "react";
import Input from "./Input.jsx";
import { formatCurrency } from "../util/helper.js";

/**
 * BudgetForm – Form thiết lập hạn mức ngân sách
 * Props:
 *   categories  – danh sách category loại "expense"
 *   onSave      – callback(dto) khi submit
 *   onCancel    – callback khi bấm Hủy
 */
const BudgetForm = ({ categories = [], onSave, onCancel }) => {
    const now = new Date();

    const [form, setForm] = useState({
        categoryId: "",
        amountLimit: "",
        month: now.getMonth() + 1,
        year: now.getFullYear(),
    });

    const handleChange = (key, value) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/\D/g, "");
        handleChange("amountLimit", value);
    };

    const selectedCategoryId = form.categoryId || categories[0]?.id || "";

    const handleSubmit = () => {
        if (!selectedCategoryId) return alert("Vui lòng chọn danh mục");
        if (!form.amountLimit || Number(form.amountLimit) <= 0)
            return alert("Số tiền hạn mức phải lớn hơn 0");

        onSave({
            categoryId: Number(selectedCategoryId),
            amountLimit: Number(form.amountLimit),
            month: Number(form.month),
            year: Number(form.year),
        });
    };

    const categoryOptions = categories.map((c) => ({
        value: c.id,
        label: c.name,
    }));

    // Tạo danh sách tháng
    const monthOptions = Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: `Tháng ${i + 1}`,
    }));

    // Tạo danh sách năm (3 năm gần nhất)
    const currentYear = now.getFullYear();
    const yearOptions = [currentYear - 1, currentYear, currentYear + 1].map(
        (y) => ({ value: y, label: `${y}` })
    );

    return (
        <div className="budget-form">
            <Input
                label="Danh mục chi tiêu"
                value={selectedCategoryId}
                onChange={({ target }) => handleChange("categoryId", target.value)}
                isSelect
                options={categoryOptions}
                placeholder={
                    categories.length === 0
                        ? "Chưa có danh mục expense, hãy tạo trước"
                        : "Chọn danh mục"
                }
            />

            <Input
                label="Hạn mức (VNĐ)"
                type="text"
                value={formatCurrency(form.amountLimit)}
                onChange={handleAmountChange}
                placeholder="VD: 2.000.000"
            />

            <div className="budget-form__row">
                <div className="budget-form__half">
                    <Input
                        label="Tháng"
                        value={form.month}
                        onChange={({ target }) => handleChange("month", target.value)}
                        isSelect
                        options={monthOptions}
                    />
                </div>
                <div className="budget-form__half">
                    <Input
                        label="Năm"
                        value={form.year}
                        onChange={({ target }) => handleChange("year", target.value)}
                        isSelect
                        options={yearOptions}
                    />
                </div>
            </div>

            <div className="budget-form__actions">
                <button
                    type="button"
                    className="add-btn"
                    onClick={onCancel}
                    id="budget-form-cancel-btn"
                >
                    Hủy
                </button>
                <button
                    type="button"
                    className="add-btn add-btn-fill"
                    onClick={handleSubmit}
                    id="budget-form-save-btn"
                    disabled={categories.length === 0}
                >
                    Lưu hạn mức
                </button>
            </div>
        </div>
    );
};

export default BudgetForm;

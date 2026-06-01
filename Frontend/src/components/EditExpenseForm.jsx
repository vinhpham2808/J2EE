import { useState } from "react";
import EmojiPickerPopup from "./EmojiPickerPopup.jsx";
import Input from "./Input.jsx";
import { formatCurrency } from "../util/helper.js";
import { AlertTriangle } from "lucide-react";
import { normalizeToIsoDate } from "../util/dateInput.js";

const EditExpenseForm = ({ onUpdateExpense, expenseToEdit, categories, jars = [] }) => {
    const [expense, setExpense] = useState({
        id: expenseToEdit?.id || null,
        name: expenseToEdit?.name || "",
        categoryId: expenseToEdit?.categoryId || "",
        amount: expenseToEdit?.amount ? String(expenseToEdit.amount) : "",
        date: normalizeToIsoDate(expenseToEdit?.date),
        icon: expenseToEdit?.icon || "",
        jarId: expenseToEdit?.jarId || "",
    });

    const handleChange = (key, value) => setExpense({ ...expense, [key]: value });

    const handleAmountChange = (e) => {
        const rawValue = e.target.value.replace(/\D/g, "");
        handleChange("amount", rawValue);
    };

    const categoryOptions = categories.map((cat) => ({
        value: cat.id,
        label: `${cat.name}`,
    }));

    const jarOptions = [
        { value: "", label: "Không gán vào hũ" },
        ...jars.map((j) => ({ value: j.id, label: `🏦 ${j.name?.trim() || 'Hũ không tên'}` })),
    ];

    const selectedJar = jars.find((j) => String(j.id) === String(expense.jarId));
    const selectedCategoryId = expense.categoryId || categories[0]?.id || "";
    const parsedAmount = Number(expense.amount) || 0;

    const originalAmount = expenseToEdit?.jarId === expense.jarId ? (expenseToEdit?.amount || 0) : 0;
    const effectiveBalance = selectedJar ? ((selectedJar.currentBalance ?? 0) + originalAmount) : 0;
    const insufficientBalance = selectedJar && parsedAmount > effectiveBalance;

    return (
        <div>
            <EmojiPickerPopup
                icon={expense.icon}
                onSelect={(selectedIcon) => handleChange("icon", selectedIcon)}
            />

            <Input
                value={expense.name}
                onChange={({ target }) => handleChange("name", target.value)}
                label="Tên giao dịch"
                placeholder="VD: Tiền điện, Cáp quang"
                type="text"
            />

            <Input
                label="Danh mục"
                placeholder={categories.length === 0 ? "Vui lòng tạo danh mục chi tiêu trước" : "Chọn danh mục"}
                value={selectedCategoryId}
                onChange={({ target }) => handleChange("categoryId", target.value)}
                isSelect={true}
                options={categoryOptions}
            />

            {jars.length > 0 && (
                <div className="mt-0">
                    <Input
                        label="Trừ từ hũ"
                        placeholder="Chọn hũ thanh toán"
                        value={expense.jarId}
                        onChange={({ target }) => handleChange("jarId", target.value)}
                        isSelect={true}
                        options={jarOptions}
                    />
                    {insufficientBalance && (
                        <div className="flex items-center gap-1.5 mt-1 px-1">
                            <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                Số dư hũ không đủ ({new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(selectedJar.currentBalance)})
                            </p>
                        </div>
                    )}
                </div>
            )}

            <Input
                value={formatCurrency(expense.amount)}
                onChange={handleAmountChange}
                label="Số tiền"
                placeholder="VD: 150.000"
                type="text"
            />

            <Input
                value={expense.date}
                onChange={({ target }) => handleChange("date", target.value)}
                label="Ngày"
                placeholder=""
                type="date"
            />

            <div className="flex justify-end mt-6">
                <button
                    type="button"
                    className="add-btn add-btn-fill"
                    onClick={() => onUpdateExpense({ ...expense, categoryId: selectedCategoryId })}
                >Cập nhật chi tiêu</button>
            </div>
        </div>
    );
};

export default EditExpenseForm;

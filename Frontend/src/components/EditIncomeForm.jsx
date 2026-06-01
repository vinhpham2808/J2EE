import {useEffect, useState} from "react";
import EmojiPickerPopup from "./EmojiPickerPopup.jsx";
import Input from "./Input.jsx";
import {LoaderCircle, ChevronDown, ChevronUp} from "lucide-react";
import { formatCurrency } from "../util/helper.js";
import axiosConfig from "../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import { hasDisplayImage } from "../util/imageDisplay.js";
import { normalizeToIsoDate } from "../util/dateInput.js";

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n ?? 0);

const EditIncomeForm = ({onUpdateIncome, categories, incomeData}) => {
    const [income, setIncome] = useState({
        name: incomeData.name || '',
        amount: String(incomeData.amount || ''),
        date: normalizeToIsoDate(incomeData.date),
        icon: incomeData.icon || '',
        categoryId: incomeData.categoryId || ''
    });
    const [loading, setLoading] = useState(false);
    const [jars, setJars] = useState([]);
    const [allocations, setAllocations] = useState([]);
    const [showAllocations, setShowAllocations] = useState(true);
    const [isAmountChanged, setIsAmountChanged] = useState(false);

    useEffect(() => {
        axiosConfig.get(API_ENDPOINTS.GET_JARS)
            .then((res) => {
                if (res.data) {
                    setJars(res.data);
                }
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (jars.length > 0 && incomeData.allocations && incomeData.allocations.length > 0) {
            const existingAllocations = incomeData.allocations;
            const allocs = jars.map((jar) => {
                const existing = existingAllocations.find(a => a.jarId === jar.id);
                return {
                    jarId: jar.id,
                    jarName: jar.name,
                    jarIcon: jar.icon,
                    jarColor: jar.color,
                    amount: existing ? Number(existing.amount) : 0,
                    percentage: jar.targetPercentage ?? 0
                };
            });
            setAllocations(allocs);
        }
    }, [jars, incomeData.allocations]);

    const categoryOptions = categories.map(category => ({
        value: category.id,
        label: category.name
    }));

    const handleChange = (key, value) => {
        setIncome({...income, [key]: value});
    };

    const handleAmountChange = (e) => {
        const rawValue = e.target.value.replace(/\D/g, "");
        handleChange("amount", rawValue);
        setIsAmountChanged(true);
    };

    useEffect(() => {
        if (isAmountChanged && jars.length > 0 && income.amount) {
            const total = Number(income.amount);
            if (total > 0) {
                let remaining = total;
                const allocs = jars.map((jar, index) => {
                    const pct = jar.targetPercentage ?? 0;
                    let amt;
                    if (index === jars.length - 1) {
                        amt = remaining;
                    } else {
                        amt = Math.round(total * pct / 100);
                        remaining -= amt;
                    }
                    return { jarId: jar.id, jarName: jar.name, jarIcon: jar.icon, jarColor: jar.color, amount: amt, percentage: pct };
                });
                setAllocations(allocs);
            } else {
                setAllocations([]);
            }
        }
    }, [income.amount, jars, isAmountChanged]);

    const handleAllocationAmountChange = (index, rawValue) => {
        const newAmount = Number(rawValue) || 0;
        let diff = newAmount - allocations[index].amount;
        
        const newAllocs = [...allocations];
        newAllocs[index] = { ...newAllocs[index], amount: newAmount };

        if (diff !== 0 && newAllocs.length > 1) {
            for (let i = 0; i < newAllocs.length; i++) {
                if (i !== index && diff !== 0) {
                    let currentOtherAmount = newAllocs[i].amount;
                    if (diff > 0) {
                        const subtractAmount = Math.min(currentOtherAmount, diff);
                        newAllocs[i].amount -= subtractAmount;
                        diff -= subtractAmount;
                    } else {
                        newAllocs[i].amount -= diff;
                        diff = 0;
                    }
                }
            }
        }
        
        setAllocations(newAllocs);
    };

    const handleUpdateIncome = async () => {
        setLoading(true);
        try {
            const payload = { ...income };
            if (jars.length > 0 && allocations.length > 0) {
                payload.allocations = allocations
                    .filter((a) => a.amount > 0)
                    .map((a) => ({ jarId: a.jarId, amount: a.amount }));
            }
            await onUpdateIncome(incomeData.id, payload);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (categories.length > 0 && !income.categoryId) {
            setIncome((prev) => ({...prev, categoryId: categories[0].id}));
        }
    }, [categories, income.categoryId]);

    const totalAllocated = allocations.reduce((s, a) => s + a.amount, 0);
    const incomeAmount = Number(income.amount) || 0;
    const allocationDiff = incomeAmount - totalAllocated;

    return (
        <div>
            <EmojiPickerPopup
                icon={income.icon}
                onSelect={(selectedIcon) => handleChange('icon', selectedIcon)}
            />

            <Input
                value={income.name}
                onChange={({target}) => handleChange('name', target.value)}
                label="Tên giao dịch"
                placeholder="VD: Lương, Bán thời gian, Thưởng"
                type="text"
            />

            <Input
                label="Danh mục"
                placeholder={categories.length === 0 ? "Vui lòng tạo danh mục thu nhập trước" : "Chọn danh mục"}
                value={income.categoryId}
                onChange={({target}) => handleChange('categoryId', target.value)}
                isSelect={true}
                options={categoryOptions}
            />

            <Input
                value={formatCurrency(income.amount)}
                onChange={handleAmountChange}
                label="Số tiền"
                placeholder="VD: 500.000"
                type="text"
            />

            <Input
                value={income.date}
                onChange={({target}) => handleChange('date', target.value)}
                label="Ngày"
                placeholder=""
                type="date"
            />

            {jars.length > 0 && incomeAmount > 0 && (
                <div className="mt-4">
                    <button
                        type="button"
                        onClick={() => setShowAllocations(!showAllocations)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl
                            bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20
                            text-sm font-medium text-amber-700 dark:text-amber-400 transition-colors
                            hover:bg-amber-100 dark:hover:bg-amber-500/15"
                    >
                        <span>💰 Phân bổ vào {jars.length} hũ ({fmt(totalAllocated)} / {fmt(incomeAmount)})</span>
                        {showAllocations ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {showAllocations && (
                        <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            {allocations.map((alloc, index) => (
                                <div
                                    key={alloc.jarId}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                                        bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10"
                                >
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                                        style={{ backgroundColor: `${alloc.jarColor}20` }}
                                    >
                                        {alloc.jarIcon ? (
                                            hasDisplayImage(alloc.jarIcon) ? (
                                                <img src={alloc.jarIcon} alt={alloc.jarName} className="w-5 h-5 object-contain" />
                                            ) : (
                                                <span className="text-lg select-none">{alloc.jarIcon}</span>
                                            )
                                        ) : "🏦"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                                            {alloc.jarName}
                                            <span className="text-xs text-slate-400 ml-1">({alloc.percentage}%)</span>
                                        </p>
                                    </div>
                                    <input
                                        type="text"
                                        value={formatCurrency(String(alloc.amount))}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/\D/g, "");
                                            handleAllocationAmountChange(index, raw);
                                        }}
                                        className="w-32 text-right text-sm px-3 py-1.5 rounded-lg
                                            bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10
                                            text-slate-800 dark:text-white outline-none
                                            focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                                    />
                                </div>
                            ))}

                            {allocationDiff !== 0 && (
                                <p className={`text-xs px-1 ${allocationDiff > 0 ? "text-amber-600 dark:text-amber-400" : "text-red-500"}`}>
                                    {allocationDiff > 0 ? `⚠ Còn ${fmt(allocationDiff)} chưa được phân bổ` : `⚠ Vượt ${fmt(Math.abs(allocationDiff))} so với số tiền nhập`}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-end mt-6">
                <button
                    onClick={handleUpdateIncome}
                    disabled={loading}
                    className="add-btn add-btn-fill">
                    {loading ? (
                        <>
                            <LoaderCircle className="w-4 h-4 animate-spin"/>Đang cập nhật...</>
                    ): (
                        <>Cập nhật thu nhập</>
                    )}
                </button>
            </div>
        </div>
    );
};

export default EditIncomeForm;

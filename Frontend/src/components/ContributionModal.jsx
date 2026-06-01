import { useState, useEffect, useCallback } from "react";
import axiosConfig from "../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import Modal from "./Modal.jsx";
import { HandCoins, History } from "lucide-react";
import DateInput from "./DateInput.jsx";
import { getTodayIsoDate } from "../util/dateInput.js";

const fmt = (n) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const formatDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

const ContributionModal = ({ goal, onClose, onContribute }) => {
    const [tab, setTab] = useState("contribute");
    const [contributions, setContributions] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [form, setForm] = useState({
        amount: "",
        contributionDate: getTodayIsoDate(),
        note: "",
    });

    const fetchHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const res = await axiosConfig.get(API_ENDPOINTS.SAVING_GOAL_CONTRIBUTIONS(goal.id));
            if (res.data) setContributions(res.data);
        } catch (err) {
            console.error("Lỗi tải lịch sử:", err);
        } finally {
            setLoadingHistory(false);
        }
    }, [goal.id]);

    useEffect(() => {
        if (tab === "history") fetchHistory();
    }, [fetchHistory, tab]);

    const handleSubmit = async () => {
        if (!form.amount || Number(form.amount) <= 0) { alert("Số tiền phải lớn hơn 0"); return; }
        const dto = {
            amount: Number(form.amount),
            contributionDate: form.contributionDate,
            note: form.note.trim() || null,
        };
        const ok = await onContribute(goal.id, dto);
        if (ok) {
            setForm({ amount: "", contributionDate: getTodayIsoDate(), note: "" });
            fetchHistory();
        }
    };

    const fmtAmount = (v) => {
        if (!v && v !== 0) return "";
        return Number(v).toLocaleString("vi-VN");
    };

    const labelClass = "text-xs font-medium text-slate-700 dark:text-slate-300";

    return (
        <Modal isOpen={true} onClose={onClose} title={`Đóng góp – ${goal.name}`}>
            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-white/10 mb-4">
                <button
                    onClick={() => setTab("contribute")}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                        tab === "contribute"
                            ? "border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400"
                            : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    }`}
                >
                    <HandCoins size={16} /> Đóng góp
                </button>
                <button
                    onClick={() => setTab("history")}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                        tab === "history"
                            ? "border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400"
                            : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    }`}
                >
                    <History size={16} /> Lịch sử
                </button>
            </div>

            {tab === "contribute" && (
                <div className="flex flex-col gap-4">
                    <div className="bg-violet-50 dark:bg-violet-500/10 rounded-xl p-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Đã có</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmt(goal.currentAmount)}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-slate-500 dark:text-slate-400">Còn thiếu</span>
                            <span className="font-semibold text-red-500 dark:text-red-400">{fmt(goal.remainingAmount)}</span>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Số tiền đóng góp (VND)</label>
                        <input
                            type="text"
                            value={fmtAmount(form.amount)}
                            onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/\D/g, "") })}
                            placeholder="VD: 1,000,000"
                            className="form-input"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Ngày đóng góp</label>
                        <DateInput
                            value={form.contributionDate}
                            onChange={(e) => setForm({ ...form, contributionDate: e.target.value })}
                            className="form-input"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Ghi chú (tuỳ chọn)</label>
                        <input
                            type="text"
                            value={form.note}
                            onChange={(e) => setForm({ ...form, note: e.target.value })}
                            placeholder="VD: Lương tháng 3"
                            className="form-input"
                        />
                    </div>
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                        Xác nhận đóng góp
                    </button>
                </div>
            )}

            {tab === "history" && (
                <div>
                    {loadingHistory && (
                        <p className="text-center text-slate-400 py-6">Đang tải...</p>
                    )}
                    {!loadingHistory && contributions.length === 0 && (
                        <p className="text-center text-slate-400 py-6">Chưa có lịch sử đóng góp</p>
                    )}
                    {!loadingHistory && contributions.length > 0 && (
                        <div className="max-h-72 overflow-y-auto space-y-2">
                            {contributions.map((c) => (
                                <div key={c.id} className="flex items-center justify-between bg-slate-50 dark:bg-white/5 rounded-xl px-4 py-3">
                                    <div>
                                        <p className="text-sm font-medium text-slate-800 dark:text-white">
                                            + {fmt(c.amount)}
                                        </p>
                                        {c.note && <p className="text-xs text-slate-400">{c.note}</p>}
                                    </div>
                                    <p className="text-xs text-slate-400">{formatDate(c.contributionDate)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};

export default ContributionModal;

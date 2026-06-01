import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "./Modal.jsx";
import Input from "./Input.jsx";
import { ArrowRight } from "lucide-react";
import { formatCurrency } from "../util/helper.js";

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n ?? 0);

const JarTransferModal = ({ jars, onTransfer, onClose, defaultFromJarId }) => {
  const [fromJarId, setFromJarId] = useState(defaultFromJarId || "");
  const [toJarId, setToJarId] = useState("");
  const [amount, setAmount] = useState("");

  const jarOptions = jars.map((j) => ({
    value: j.id,
    label: `🏦 ${j.name?.trim() || 'Hũ không tên'} (${fmt(j.currentBalance)})`,
  }));

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    setAmount(raw);
  };

  const handleSubmit = () => {
    if (!fromJarId || !toJarId || !amount) {
      toast.error("Vui lòng chọn hũ nguồn, hũ đích và nhập số tiền.");
      return;
    }
    if (fromJarId === toJarId) return;
    onTransfer(Number(fromJarId), Number(toJarId), Number(amount));
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Chuyển tiền giữa các hũ">
      <div className="space-y-4">
        <Input
          label="Từ hũ"
          placeholder="Chọn hũ nguồn"
          value={fromJarId}
          onChange={({ target }) => setFromJarId(target.value)}
          isSelect={true}
          options={jarOptions}
        />

        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center">
            <ArrowRight size={16} className="text-amber-500 rotate-90" />
          </div>
        </div>

        <Input
          label="Đến hũ"
          placeholder="Chọn hũ đích"
          value={toJarId}
          onChange={({ target }) => setToJarId(target.value)}
          isSelect={true}
          options={jarOptions}
        />

        <Input
          value={formatCurrency(amount)}
          onChange={handleAmountChange}
          label="Số tiền chuyển"
          placeholder="VD: 500.000"
          type="text"
        />

        {fromJarId && toJarId && fromJarId === toJarId && (
          <p className="text-xs text-red-500">Không thể chuyển tiền vào cùng một hũ.</p>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium
              text-slate-600 dark:text-slate-400
              hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!fromJarId || !toJarId || !amount || fromJarId === toJarId}
            className="add-btn add-btn-fill disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Chuyển tiền
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default JarTransferModal;

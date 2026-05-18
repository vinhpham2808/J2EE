import { useState, useEffect } from "react";
import { Send, Bell, Clock, Search, RefreshCw, Pencil, Trash2, X, Check } from "lucide-react";
import axiosConfig from "../../util/axiosConfig";
import { API_ENDPOINTS } from "../../util/apiEndpoints";
import toast from "react-hot-toast";
import { usePageTitle } from "../../hooks/usePageTitle.js";

const AdminNotifications = () => {
  usePageTitle("Quản lý thông báo", "Money Manager Admin");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete confirm state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBroadcasts = async () => {
    setLoading(true);
    try {
      const res = await axiosConfig.get(API_ENDPOINTS.ADMIN_NOTIFICATIONS);
      if (res.status === 200) {
        setBroadcasts(res.data);
      }
    } catch (err) {
      toast.error("Lỗi tải lịch sử thông báo");
      console.error("Failed to fetch broadcasts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axiosConfig.post(API_ENDPOINTS.ADMIN_BROADCAST, { title, message });
      if (res.status === 200) {
        toast.success("Gửi thông báo thành công!");
        setTitle("");
        setMessage("");
        fetchBroadcasts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi gửi thông báo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (b) => {
    setEditingId(b.id);
    setEditTitle(b.title);
    setEditMessage(b.message);
    setDeleteConfirmId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditMessage("");
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editMessage.trim()) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung");
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await axiosConfig.put(
        API_ENDPOINTS.ADMIN_NOTIFICATION_UPDATE(editingId),
        { title: editTitle, message: editMessage }
      );
      if (res.status === 200) {
        toast.success("Cập nhật thông báo thành công!");
        // Immediate UI update
        setBroadcasts((prev) =>
          prev.map((b) =>
            b.id === editingId ? { ...b, title: editTitle, message: editMessage } : b
          )
        );
        handleCancelEdit();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi cập nhật thông báo");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (id) => {
    setIsDeleting(true);
    try {
      const res = await axiosConfig.delete(API_ENDPOINTS.ADMIN_NOTIFICATION_DELETE(id));
      if (res.status === 200) {
        toast.success("Xoá thông báo thành công!");
        // Immediate UI update - remove from list
        setBroadcasts((prev) => prev.filter((b) => b.id !== id));
        setDeleteConfirmId(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi xoá thông báo");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredBroadcasts = broadcasts.filter(b =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="text-violet-500" />
            Gửi Thông Báo Hệ Thống
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Gửi thông báo broadcast đến tất cả người dùng
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Compose */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-indigo-500"></div>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Soạn thông báo mới</h2>

            <form onSubmit={handleSendBroadcast} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  placeholder="Nhập tiêu đề thông báo..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Nội dung <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                  placeholder="Nhập nội dung chi tiết..."
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                  ) : (
                    <>
                      <Send size={18} /> Gửi đến tất cả
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* History List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm min-h-[500px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Lịch sử thông báo</h2>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="pl-9 pr-4 py-2 w-full sm:w-64 rounded-xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
                <button
                  onClick={fetchBroadcasts}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Làm mới"
                >
                  <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-violet-600 animate-spin"></div>
              </div>
            ) : filteredBroadcasts.length > 0 ? (
              <div className="space-y-4">
                {filteredBroadcasts.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 group"
                  >
                    {/* Edit mode */}
                    {editingId === b.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#1E293B] border border-violet-500/50 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                          placeholder="Tiêu đề"
                        />
                        <textarea
                          value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#1E293B] border border-violet-500/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                          placeholder="Nội dung"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSaveEdit}
                            disabled={isSavingEdit}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all disabled:opacity-60"
                          >
                            {isSavingEdit ? (
                              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                            ) : (
                              <><Check size={14} /> Lưu</>
                            )}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all"
                          >
                            <X size={14} /> Huỷ
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Top row: title + timestamp + actions */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-slate-800 dark:text-white break-words pr-1">
                            {b.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {/* Timestamp */}
                            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-[#1E293B] px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/5 whitespace-nowrap">
                              <Clock size={12} />
                              {new Date(b.createdAt).toLocaleString('vi-VN')}
                            </span>
                            {/* Action buttons */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleStartEdit(b)}
                                className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-colors"
                                title="Chỉnh sửa"
                              >
                                <Pencil size={14} />
                              </button>
                              {deleteConfirmId === b.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDelete(b.id)}
                                    disabled={isDeleting}
                                    className="p-1.5 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
                                    title="Xác nhận xoá"
                                  >
                                    {isDeleting ? (
                                      <div className="w-3.5 h-3.5 rounded-full border-2 border-red-400 border-t-transparent animate-spin"></div>
                                    ) : (
                                      <Check size={14} />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="p-1.5 rounded-lg bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
                                    title="Huỷ"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setDeleteConfirmId(b.id); setEditingId(null); }}
                                  className="p-1.5 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
                                  title="Xoá"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {b.message}
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-4">
                  <Bell size={24} className="text-slate-400" />
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-medium">Chưa có thông báo nào được gửi.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;

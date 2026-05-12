import { useState, useEffect } from "react";
import { Lock, Mail, RefreshCw, LoaderCircle } from "lucide-react";
import axiosConfig from "../util/axiosConfig.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";
import toast from "react-hot-toast";

const EmailNotificationSettings = () => {
    const [preferences, setPreferences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        setLoading(true);
        try {
            const res = await axiosConfig.get(API_ENDPOINTS.GET_EMAIL_PREFERENCES);
            if (res.status === 200) {
                setPreferences(res.data);
            }
        } catch (error) {
            toast.error("Lỗi tải cài đặt email");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (type) => {
        setPreferences(prev =>
            prev.map(pref =>
                pref.type === type ? { ...pref, isEnabled: !pref.isEnabled } : pref
            )
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await axiosConfig.put(API_ENDPOINTS.UPDATE_EMAIL_PREFERENCES, preferences);
            if (res.status === 200) {
                toast.success("Cập nhật cài đặt email thành công");
            }
        } catch (error) {
            toast.error("Lỗi cập nhật cài đặt");
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!window.confirm("Bạn có chắc muốn đặt lại về mặc định?")) return;
        setResetting(true);
        try {
            const res = await axiosConfig.post(API_ENDPOINTS.RESET_EMAIL_PREFERENCES);
            if (res.status === 200) {
                toast.success("Đặt lại cài đặt email về mặc định");
                fetchPreferences();
            }
        } catch (error) {
            toast.error("Lỗi đặt lại cài đặt");
            console.error(error);
        } finally {
            setResetting(false);
        }
    };

    const criticalPrefs = preferences.filter(p => p.isCritical);
    const optionalPrefs = preferences.filter(p => p.isOptional);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <LoaderCircle className="animate-spin text-violet-500" size={28} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Critical section */}
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5">
                <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white mb-4">
                    <Lock size={18} className="text-red-500" />
                    Email Quan Trọng
                    <span className="ml-1 text-xs font-normal text-slate-500 dark:text-slate-400">(Không thể tắt)</span>
                </h3>
                <div className="space-y-2">
                    {criticalPrefs.map(pref => (
                        <div
                            key={pref.type}
                            className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-white/5 px-4 py-3"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl leading-none">{pref.icon}</span>
                                <span className="text-sm text-slate-700 dark:text-slate-300">{pref.displayName}</span>
                            </div>
                            <div className="relative inline-flex items-center">
                                <div className="h-6 w-11 rounded-full bg-emerald-500 opacity-60" />
                                <div className="absolute right-1 h-4 w-4 rounded-full bg-white" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Optional section */}
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5">
                <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white mb-4">
                    <Mail size={18} className="text-violet-500" />
                    Email Tuỳ Chọn
                </h3>
                <div className="space-y-1">
                    {optionalPrefs.map(pref => (
                        <div
                            key={pref.type}
                            className="flex items-center justify-between rounded-2xl px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl leading-none">{pref.icon}</span>
                                <span className="text-sm text-slate-700 dark:text-slate-300">{pref.displayName}</span>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input
                                    type="checkbox"
                                    checked={!!pref.isEnabled}
                                    onChange={() => handleToggle(pref.type)}
                                    className="sr-only peer"
                                />
                                <div className="h-6 w-11 rounded-full bg-slate-200 dark:bg-slate-700 peer-checked:bg-violet-600 transition-colors" />
                                <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-1">
                <button
                    onClick={handleReset}
                    disabled={resetting || saving}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 dark:border-white/10 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50"
                >
                    {resetting ? <LoaderCircle className="animate-spin" size={15} /> : <RefreshCw size={15} />}
                    Đặt lại mặc định
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving || resetting}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 hover:bg-violet-500 px-6 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
                >
                    {saving ? (
                        <><LoaderCircle className="animate-spin" size={15} />Đang lưu...</>
                    ) : (
                        "Lưu thay đổi"
                    )}
                </button>
            </div>
        </div>
    );
};

export default EmailNotificationSettings;

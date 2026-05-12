import {useContext, useEffect, useState} from "react";
import {BadgeCheck, LoaderCircle, Mail, ShieldCheck, Sparkles, User} from "lucide-react";
import toast from "react-hot-toast";
import Dashboard from "../components/Dashboard.jsx";
import Input from "../components/Input.jsx";
import ProfilePhotoSelector from "../components/ProfilePhotoSelector.jsx";
import EmailNotificationSettings from "../components/EmailNotificationSettings.jsx";
import {useUser} from "../hooks/useUser.jsx";
import {AppContext} from "../context/AppContext.jsx";
import axiosConfig from "../util/axiosConfig.jsx";
import {API_ENDPOINTS} from "../util/apiEndpoints.js";
import {validateEmail} from "../util/validation.js";
import uploadProfileImage from "../util/uploadProfileImage.js";
import { usePageTitle } from "../hooks/usePageTitle.js";

const Profile = () => {
    useUser();
    usePageTitle("Hồ sơ người dùng");

    const {user, setUser} = useContext(AppContext);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [currentImageUrl, setCurrentImageUrl] = useState("");
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPasswordFields, setShowPasswordFields] = useState(false);
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("info");

    useEffect(() => {
        if (!user) return;
        setFullName(user.fullName || "");
        setEmail(user.email || "");
        setCurrentImageUrl(user.profileImageUrl || "");
    }, [user]);

    const persistToken = (token, nextEmail) => {
        if (localStorage.getItem("token")) {
            localStorage.setItem("token", token);
            sessionStorage.removeItem("token");
            if (localStorage.getItem("rememberedEmail") !== null) {
                localStorage.setItem("rememberedEmail", nextEmail);
            }
            return;
        }
        sessionStorage.setItem("token", token);
        localStorage.removeItem("token");
    };

    const handleShowPasswordFields = () => {
        setShowPasswordFields(true);
        setError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!fullName.trim()) { setError("Vui lòng nhập họ và tên."); return; }
        if (!validateEmail(email)) { setError("Vui lòng nhập địa chỉ email hợp lệ."); return; }

        if (showPasswordFields) {
            if (!currentPassword.trim()) { setError("Vui lòng nhập mật khẩu hiện tại."); return; }
            if (!newPassword.trim()) { setError("Vui lòng nhập mật khẩu mới."); return; }
            if (newPassword.trim().length < 6) { setError("Mật khẩu mới phải có ít nhất 6 ký tự."); return; }
            if (newPassword !== confirmPassword) { setError("Xác nhận mật khẩu mới chưa khớp."); return; }
        }

        setError("");
        setIsSaving(true);

        try {
            let profileImageUrl = currentImageUrl;
            if (profilePhoto) profileImageUrl = await uploadProfileImage(profilePhoto);

            const response = await axiosConfig.put(API_ENDPOINTS.UPDATE_PROFILE, {
                fullName: fullName.trim(),
                email: email.trim(),
                profileImageUrl,
                currentPassword: currentPassword.trim(),
                newPassword: newPassword.trim(),
            });

            const {token, user: updatedUser} = response.data;
            persistToken(token, updatedUser.email || email.trim());
            setUser(updatedUser);
            setCurrentImageUrl(updatedUser.profileImageUrl || "");
            setProfilePhoto(null);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setShowPasswordFields(false);
            toast.success("Cập nhật hồ sơ thành công.");
        } catch (err) {
            console.error("Failed to update profile", err);
            setError(err.response?.data?.message || err.message || "Không thể cập nhật hồ sơ.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dashboard activeMenu="Hồ sơ">
            <div className="mx-auto my-6 max-w-5xl">
                <div className="space-y-6">
                    {/* Hero banner */}
                    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-linear-to-r from-slate-900 via-slate-800 to-violet-900 p-6 text-white shadow-xl">
                        <div className="flex items-center gap-3 text-sm text-white/70">
                            <Sparkles size={18} />
                            Không gian cá nhân
                        </div>
                        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_280px]">
                            <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm sm:flex-row sm:items-center">
                                {currentImageUrl ? (
                                    <img
                                        src={currentImageUrl}
                                        alt={fullName || "Ảnh đại diện"}
                                        className="h-20 w-20 rounded-3xl object-cover ring-2 ring-white/20"
                                    />
                                ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10">
                                        <User size={34} />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="text-xs uppercase tracking-[0.24em] text-white/50">Tài khoản</p>
                                    <div className="flex items-center gap-2">
                                        <h1 className="truncate text-2xl font-semibold">{fullName || "Người dùng"}</h1>
                                        {user?.role === "admin" && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wide border border-amber-500/30 shrink-0">
                                                <ShieldCheck size={11} />
                                                Admin
                                            </span>
                                        )}
                                    </div>
                                    <p className="truncate text-sm text-white/70">{email || "Chưa có email"}</p>
                                </div>
                            </div>
                            <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4">
                                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Gói hiện tại</p>
                                <p className="mt-2 flex items-center gap-2 text-base font-semibold">
                                    <BadgeCheck size={16} className="text-emerald-300" />
                                    {user?.subscriptionPlan || "FREE"}
                                </p>
                                {user?.subscriptionExpiresAt && (
                                    <p className="mt-1 text-[10px] text-white/50">
                                        Hết hạn: {new Date(user.subscriptionExpiresAt).toLocaleDateString('vi-VN')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Tab navigation */}
                    <div className="flex gap-1 border-b border-slate-200 dark:border-white/10">
                        <button
                            type="button"
                            onClick={() => setActiveTab("info")}
                            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                                activeTab === "info"
                                    ? "border-violet-600 text-violet-600 dark:text-violet-400"
                                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                            }`}
                        >
                            Thông Tin Cá Nhân
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("email")}
                            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                                activeTab === "email"
                                    ? "border-violet-600 text-violet-600 dark:text-violet-400"
                                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                            }`}
                        >
                            Cài Đặt Email
                        </button>
                    </div>

                    {/* Email settings tab */}
                    {activeTab === "email" && (
                        <section className="rounded-[28px] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm sm:p-8">
                            <div className="flex flex-col gap-2 border-b border-slate-100 dark:border-white/10 pb-5 mb-6">
                                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Cài Đặt Email</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Quản lý các loại email bạn muốn nhận từ Money Manager.
                                </p>
                            </div>
                            <EmailNotificationSettings />
                        </section>
                    )}

                    {/* Profile info tab */}
                    {activeTab === "info" && (
                    <section className="rounded-[28px] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm sm:p-8">
                        <div className="flex flex-col gap-2 border-b border-slate-100 dark:border-white/10 pb-5">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Chỉnh sửa hồ sơ</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Cập nhật thông tin cá nhân, ảnh đại diện và mật khẩu của bạn.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 p-5">
                                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Ảnh đại diện</h3>
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            Tải ảnh mới hoặc xoá ảnh hiện tại nếu muốn làm mới hồ sơ.
                                        </p>
                                    </div>
                                    <ProfilePhotoSelector
                                        image={profilePhoto}
                                        setImage={setProfilePhoto}
                                        currentImageUrl={currentImageUrl}
                                        onRemoveCurrentImage={() => setCurrentImageUrl("")}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-3xl border border-slate-100 dark:border-white/10 bg-white dark:bg-white/5 p-4">
                                    <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                                        <User size={16} />
                                        Thông tin cơ bản
                                    </div>
                                    <div className="space-y-4">
                                        <Input
                                            label="Họ và tên"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Nguyễn Văn A"
                                        />
                                        <Input
                                            label="Email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="tenban@example.com"
                                            type="email"
                                        />
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-slate-100 dark:border-white/10 bg-white dark:bg-white/5 p-4">
                                    <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                                        <Mail size={16} />
                                        Đổi mật khẩu
                                    </div>
                                    <div className="space-y-4">
                                        {showPasswordFields ? (
                                            <div className="space-y-4">
                                                <Input label="Mật khẩu hiện tại" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Nhập mật khẩu hiện tại" type="password" />
                                                <Input label="Mật khẩu mới" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Ít nhất 6 ký tự" type="password" />
                                                <Input label="Xác nhận mật khẩu mới" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu mới" type="password" />
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleShowPasswordFields}
                                                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 dark:border-white/10 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:border-slate-400 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/5"
                                            >
                                                Đổi mật khẩu
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <p className="rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</p>
                            )}

                            <div className="flex flex-col gap-3 border-t border-slate-100 dark:border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Sau khi đổi email, hệ thống sẽ tự cập nhật phiên đăng nhập của bạn.
                                </p>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 px-6 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSaving ? (
                                        <><LoaderCircle className="animate-spin" size={18} />Đang lưu...</>
                                    ) : (
                                        "Lưu thay đổi"
                                    )}
                                </button>
                            </div>
                        </form>
                    </section>
                    )}
                </div>
            </div>
        </Dashboard>
    );
};

export default Profile;

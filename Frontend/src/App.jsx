import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { lazy, Suspense, useContext, useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import appLogo from "./assets/logo/favicon.png";
import AdminRoute from "./components/AdminRoute.jsx";
import { RouteContextProvider } from "./context/RouteContext.jsx";
import { AppContext } from "./context/AppContext.jsx";
import toast from "react-hot-toast";
import axiosConfig from "./util/axiosConfig.jsx";
import { API_ENDPOINTS } from "./util/apiEndpoints.js";
import { getPostAuthRedirectPath } from "./util/defaultAuthenticatedRoute.js";

const AdminLayout = lazy(() => import("./pages/Admin/AdminLayout.jsx"));
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard.jsx"));
const AdminPayments = lazy(() => import("./pages/Admin/AdminPayments.jsx"));
const AdminSettings = lazy(() => import("./pages/Admin/AdminSettings.jsx"));
const AdminSubscription = lazy(() => import("./pages/Admin/AdminSubscription.jsx"));
const AdminNotifications = lazy(() => import("./pages/Admin/AdminNotifications.jsx"));
const AdminUsers = lazy(() => import("./pages/Admin/AdminUsers.jsx"));
const Home = lazy(() => import("./pages/Home.jsx"));
const Notifications = lazy(() => import("./pages/Notifications.jsx"));
const Income = lazy(() => import("./pages/Income.jsx"));
const Expense = lazy(() => import("./pages/Expense.jsx"));
const Budget = lazy(() => import("./pages/Budget.jsx"));
const Category = lazy(() => import("./pages/Category.jsx"));
const Filter = lazy(() => import("./pages/Filter.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Signup = lazy(() => import("./pages/Signup.jsx"));
const LandingPage = lazy(() => import("./pages/LandingPage.jsx"));
const Payment = lazy(() => import("./pages/Payment.jsx"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess.jsx"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const AccountActivation = lazy(() => import("./pages/AccountActivation.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const SavingGoals = lazy(() => import("./pages/SavingGoals.jsx"));
const Jars = lazy(() => import("./pages/Jars.jsx"));
const Reports = lazy(() => import("./pages/Reports.jsx"));
const Forecast = lazy(() => import("./pages/Forecast.jsx"));
const AIChat = lazy(() => import("./pages/AIChat.jsx"));

const LoadingFallback = () => (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0E1A] text-slate-900 dark:text-slate-100 flex antialiased">
        {/* Sidebar Skeleton (hidden on mobile, visible on desktop) */}
        <aside className="h-screen w-64 fixed left-0 top-0 flex-col p-5 gap-6 border-r border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] hidden lg:flex z-50">
            {/* Logo area */}
            <div className="flex items-center gap-2.5 px-1">
                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-transparent">
                    <img src={appLogo} alt="Nova Money" className="w-8 h-8 object-cover" />
                </div>
                <div className="h-5 w-28 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse" />
            </div>
            {/* Profile area placeholder */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-20 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                    <div className="h-3 w-12 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                </div>
            </div>
            {/* Nav list placeholders */}
            <div className="flex-1 space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl">
                        <div className="w-5 h-5 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                        <div className="h-4 w-24 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                    </div>
                ))}
            </div>
        </aside>

        {/* Main Content Area Skeleton */}
        <div className="flex-1 flex flex-col ml-0 lg:ml-64">
            {/* Topbar Menubar Skeleton */}
            <header className="h-16 w-full flex items-center justify-between px-4 lg:px-6 bg-white/80 dark:bg-[#0F172A]/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
                <div className="h-8 w-48 bg-slate-200 dark:bg-white/10 rounded-xl animate-pulse" />
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse" />
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse" />
                    <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-white/10 animate-pulse" />
                </div>
            </header>

            {/* Main content grid skeleton */}
            <main className="p-4 lg:p-8 space-y-8 flex-1">
                {/* KPI Cards Skeleton Grid (6 column blocks) */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="h-3 w-12 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                                <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-white/10 animate-pulse" />
                            </div>
                            <div className="h-6 w-20 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse" />
                        </div>
                    ))}
                </div>

                {/* Dashboard layout blocks */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left main content block: Chart + Recent Transactions */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Chart card skeleton */}
                        <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 h-96 flex flex-col gap-6">
                            <div className="flex justify-between items-center">
                                <div className="h-5 w-36 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse" />
                                <div className="h-3 w-28 bg-slate-200 dark:bg-white/10 rounded-full animate-pulse" />
                            </div>
                            <div className="flex-1 w-full bg-slate-100/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 rounded-xl flex items-end justify-between p-6">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                    <div key={i} className="w-10 flex flex-col items-center gap-2">
                                        <div className="w-4 bg-slate-200 dark:bg-white/10 rounded-t animate-pulse" style={{ height: `${20 + i * 8}px` }} />
                                        <div className="h-3 w-8 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right block: AI Assistant skeleton card */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 h-96 flex flex-col gap-5">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-white/10 animate-pulse" />
                                <div className="h-5 w-40 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse" />
                            </div>
                            <div className="space-y-3.5 flex-1">
                                <div className="h-4 w-full bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                                <div className="h-4 w-5/6 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                                <div className="h-4 w-4/5 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                                <div className="h-4 w-full bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                            </div>
                            <div className="h-10 w-full bg-slate-200 dark:bg-white/10 rounded-xl animate-pulse" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
);

const App = () => {
    const { user, setUser, clearUser } = useContext(AppContext);
    const navigate = useNavigate();

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === "logout-event" && user) {
                clearUser();
                toast.error("Phiên đăng nhập đã hết hạn hoặc bạn đã đăng xuất ở một tab khác. Vui lòng đăng nhập lại.", {
                    id: "session-expired-toast"
                });
                navigate("/login?expired=true");
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => {
            window.removeEventListener("storage", handleStorageChange);
        };
    }, [user, clearUser, navigate]);

    useEffect(() => {
        if (user) return;

        const publicPaths = ["/", "/home", "/login", "/signup", "/forgot-password", "/reset-password", "/activate"];
        if (!publicPaths.includes(window.location.pathname)) {
            return;
        }

        let cancelled = false;
        const checkSession = async () => {
            try {
                const response = await axiosConfig.get(API_ENDPOINTS.GET_USER_INFO, { _skipGlobalLoading: true });
                if (!cancelled && response.data) {
                    setUser(response.data);
                    navigate(getPostAuthRedirectPath(response.data));
                }
            } catch {
                // Fail silently for guests
            }
        };

        checkSession();
        return () => {
            cancelled = true;
        };
    }, [user, setUser, navigate]);

    return (
        <RouteContextProvider>
            <Suspense fallback={<LoadingFallback />}>
                <Routes>
                    <Route path="/" element={<Root />} />
                    <Route path="/home" element={<LandingPage />} />
                    <Route path="/dashboard" element={<Home />} />
                    <Route path="/income" element={<Income />} />
                    <Route path="/expense" element={<Expense />} />
                    <Route path="/budget" element={<Budget />} />
                    <Route path="/saving-goals" element={<SavingGoals />} />
                    <Route path="/jars" element={<Jars />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/category" element={<Category />} />
                    <Route path="/filter" element={<Filter />} />
                    <Route path="/payment" element={<Payment />} />
                    <Route path="/payment/success" element={<PaymentSuccess />} />
                    <Route path="/payment/cancel" element={<PaymentCancel />} />
                    <Route path="/forecast" element={<Forecast />} />
                    <Route path="/ai-chat" element={<AIChat />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<Navigate to="/forgot-password" replace />} />
                    <Route path="/verify-otp" element={<Navigate to="/activate" replace />} />
                    <Route path="/activate" element={<AccountActivation />} />
                    <Route path="/admin" element={<AdminRoute />}>
                        <Route element={<AdminLayout />}>
                            <Route index element={<AdminDashboard />} />
                            <Route path="users" element={<AdminUsers />} />
                            <Route path="payments" element={<AdminPayments />} />
                            <Route path="subscriptions" element={<AdminSubscription />} />
                            <Route path="notifications" element={<AdminNotifications />} />
                            <Route path="settings" element={<AdminSettings />} />
                        </Route>
                    </Route>
                </Routes>
            </Suspense>
        </RouteContextProvider>
    );
}

const Root = () => {
    return <Navigate to="/home" replace />;
}

export default App;

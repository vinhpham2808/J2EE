import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { LoaderCircle } from "lucide-react";
import AdminRoute from "./components/AdminRoute.jsx";
import ChatWidget from "./components/ChatWidget.jsx";
import { RouteContextProvider } from "./context/RouteContext.jsx";

const AdminLayout = lazy(() => import("./pages/Admin/AdminLayout.jsx"));
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard.jsx"));
const AdminPayments = lazy(() => import("./pages/Admin/AdminPayments.jsx"));
const AdminSettings = lazy(() => import("./pages/Admin/AdminSettings.jsx"));
const AdminSubscription = lazy(() => import("./pages/Admin/AdminSubscription.jsx"));
const AdminNotifications = lazy(() => import("./pages/Admin/AdminNotifications.jsx"));
const AdminUsers = lazy(() => import("./pages/Admin/AdminUsers.jsx"));
const AdminAILimits = lazy(() => import("./pages/Admin/AdminAILimits.jsx"));
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
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));
const AccountActivation = lazy(() => import("./pages/AccountActivation.jsx"));
const VerifyOtp = lazy(() => import("./pages/VerifyOtp.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const SavingGoals = lazy(() => import("./pages/SavingGoals.jsx"));
const Reports = lazy(() => import("./pages/Reports.jsx"));
const Forecast = lazy(() => import("./pages/Forecast.jsx"));

const LoadingFallback = () => (
    <div className="flex justify-center items-center h-screen w-full">
        <LoaderCircle className="w-8 h-8 animate-spin text-blue-600" />
    </div>
);

const App = () => {
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
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/category" element={<Category />} />
                    <Route path="/filter" element={<Filter />} />
                    <Route path="/payment" element={<Payment />} />
                    <Route path="/payment/success" element={<PaymentSuccess />} />
                    <Route path="/payment/cancel" element={<PaymentCancel />} />
                    <Route path="/forecast" element={<Forecast />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/verify-otp" element={<VerifyOtp />} />
                    <Route path="/activate" element={<AccountActivation />} />
                    <Route path="/admin" element={<AdminRoute />}>
                        <Route element={<AdminLayout />}>
                            <Route index element={<AdminDashboard />} />
                            <Route path="users" element={<AdminUsers />} />
                            <Route path="payments" element={<AdminPayments />} />
                            <Route path="subscriptions" element={<AdminSubscription />} />
                            <Route path="notifications" element={<AdminNotifications />} />
                            <Route path="ai-limits" element={<AdminAILimits />} />
                            <Route path="settings" element={<AdminSettings />} />
                        </Route>
                    </Route>
                </Routes>
            </Suspense>
            <ChatWidget />
        </RouteContextProvider>
    );
}

const Root = () => {
    return <Navigate to="/home" replace />;
}

export default App;

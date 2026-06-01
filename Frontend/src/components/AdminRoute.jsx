import { useContext } from "react";
import { Outlet, Link } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { useUser } from "../hooks/useUser.jsx";
import { ShieldAlert } from "lucide-react";

const AdminRoute = () => {
  const { user } = useContext(AppContext);

  useUser();

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 p-4">
        <div className="flex max-w-md flex-col items-center rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-100">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500">
            <ShieldAlert size={40} />
          </div>
          <h1 className="mb-3 text-2xl font-bold text-slate-800">Access Denied</h1>
          <p className="mb-8 text-slate-500 leading-relaxed">
            You do not have permission to access the administrator dashboard. Please return to your normal dashboard.
          </p>
          <Link
            to="/dashboard"
            className="w-full rounded-xl bg-blue-600 px-6 py-3 font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default AdminRoute;

import Menubar from "./Menubar.jsx";
import Sidebar from "./Sidebar.jsx";
import Footer from "./Footer.jsx";
import { useContext } from "react";
import { AppContext } from "../context/AppContext.jsx";
import { useUser } from "../hooks/useUser.jsx";

const Dashboard = ({ children, activeMenu }) => {
  useUser();
  const { user } = useContext(AppContext);
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0A0E1A] text-slate-900 dark:text-slate-100 antialiased">
      {user && <Sidebar activeMenu={activeMenu} />}
      <Menubar activeMenu={activeMenu} />
      {user && (
        <main className="ml-0 lg:ml-64 pt-20 px-4 pb-6 lg:px-8 lg:pb-8 space-y-8 flex-1">
          {children}
        </main>
      )}
      <Footer />
    </div>
  );
};

export default Dashboard;

import { createContext, useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";

export const RouteContext = createContext({
  currentPage: null,
  pageData: null,
  pageLabel: null
});

const PAGE_MAP = {
  "/dashboard": "dashboard",
  "/income": "income",
  "/expense": "expense",
  "/budget": "budget",
  "/saving-goals": "savingGoals",
  "/reports": "reports",
  "/category": "category",
  "/filter": "filter",
  "/forecast": "forecast",
  "/profile": "profile",
  "/notifications": "notifications"
};

const PAGE_LABELS = {
  dashboard: "Trang chủ",
  income: "Thu nhập",
  expense: "Chi tiêu",
  budget: "Ngân sách",
  savingGoals: "Mục tiêu tiết kiệm",
  reports: "Báo cáo",
  category: "Danh mục",
  filter: "Bộ lọc",
  forecast: "Dự báo",
  profile: "Hồ sơ",
  notifications: "Thông báo"
};

export const RouteContextProvider = ({ children }) => {
  const location = useLocation();
  const currentPage = useMemo(() => {
    for (const [path, page] of Object.entries(PAGE_MAP)) {
      if (location.pathname.startsWith(path)) {
        return page;
      }
    }
    return null;
  }, [location.pathname]);

  const pageLabel = currentPage ? PAGE_LABELS[currentPage] : null;

  return (
    <RouteContext.Provider value={{ currentPage, pageData: null, pageLabel }}>
      {children}
    </RouteContext.Provider>
  );
};

export const useRouteContext = () => useContext(RouteContext);

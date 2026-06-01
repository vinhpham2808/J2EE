import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster, ToastBar, toast } from "react-hot-toast";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X, LoaderCircle } from "lucide-react";
import App from "./App.jsx";
import { AppContextProvider } from "./context/AppContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { PerformanceProvider } from "./context/PerformanceContext.jsx";
import { LoadingProvider } from "./context/LoadingContext.jsx";
import GlobalLoadingOverlay from "./components/GlobalLoadingOverlay.jsx";
import "./index.css";

// Apply low-perf mode immediately to avoid first-paint flash
if (localStorage.getItem("performanceMode") === "low") {
  document.documentElement.setAttribute("data-performance", "low");
}

// Polyfill for mgt.clearMarks is not a function
// Ensure global mgt object exists with all required methods
window.mgt = window.mgt || {};
window.mgt.clearMarks = window.mgt.clearMarks || (() => {});
window.mgt.clearMeasures = window.mgt.clearMeasures || (() => {});
window.mgt.mark = window.mgt.mark || (() => {});
window.mgt.measure = window.mgt.measure || (() => {});

// Wrap performance API methods to prevent errors if they don't exist
if (window.performance) {
  window.performance.clearMarks = window.performance.clearMarks || (() => {});
  window.performance.clearMeasures = window.performance.clearMeasures || (() => {});
  window.performance.mark = window.performance.mark || (() => {});
  window.performance.measure = window.performance.measure || (() => {});
}

// Global error handler to catch and suppress non-critical errors
window.addEventListener("error", (e) => {
  if (e.message?.includes?.("clearMarks is not a function") || 
      e.message?.includes?.("mgt.clearMarks")) {
    console.warn("Performance API error caught and suppressed:", e.message);
    e.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <PerformanceProvider>
      <ThemeProvider>
        <LoadingProvider>
          <AppContextProvider>
            <Toaster
              position="top-right"
              containerClassName="pointer-events-none"
              toastOptions={{
                duration: 4000,
              }}
            >
              {(t) => (
                <ToastBar
                  toast={t}
                  style={{
                    padding: 0,
                    background: "transparent",
                    boxShadow: "none",
                    transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  {({ message }) => {
                    let borderClass = "";
                    let bgClass = "";
                    let shadowClass = "";
                    let icon = null;

                    switch (t.type) {
                      case "success":
                        borderClass = "border-emerald-500/20 dark:border-emerald-500/30";
                        bgClass = "bg-white/95 dark:bg-[#0f172a]/95";
                        shadowClass = "shadow-[0_8px_30px_rgba(16,185,129,0.06)]";
                        icon = <CheckCircle className="text-emerald-500 shrink-0" size={20} />;
                        break;
                      case "error":
                        borderClass = "border-rose-500/20 dark:border-rose-500/30";
                        bgClass = "bg-white/95 dark:bg-[#0f172a]/95";
                        shadowClass = "shadow-[0_8px_30px_rgba(239,68,68,0.06)]";
                        icon = <AlertCircle className="text-rose-500 shrink-0" size={20} />;
                        break;
                      case "loading":
                        borderClass = "border-violet-500/20 dark:border-violet-500/30";
                        bgClass = "bg-white/95 dark:bg-[#0f172a]/95";
                        shadowClass = "shadow-[0_8px_30px_rgba(124,58,237,0.06)]";
                        icon = <LoaderCircle className="text-violet-500 animate-spin shrink-0" size={20} />;
                        break;
                      case "blank":
                      default:
                        borderClass = "border-slate-200 dark:border-white/10";
                        bgClass = "bg-white/95 dark:bg-[#0f172a]/95";
                        shadowClass = "shadow-lg shadow-slate-900/5 dark:shadow-slate-950/20";
                        icon = <Info className="text-violet-500 shrink-0" size={20} />;
                        break;
                    }

                    return (
                      <div
                        className={`flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl border ${borderClass} ${bgClass} ${shadowClass} backdrop-blur-md max-w-sm w-full animate-toast-spring hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 pointer-events-auto`}
                      >
                        <div className="flex items-center justify-center p-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                          {icon}
                        </div>
                        <div className="flex-1 text-[14.5px] font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                          {message}
                        </div>
                        {t.type !== "loading" && (
                          <button
                            onClick={() => toast.dismiss(t.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    );
                  }}
                </ToastBar>
              )}
            </Toaster>
            <App />
          </AppContextProvider>
          <GlobalLoadingOverlay />
        </LoadingProvider>
      </ThemeProvider>
    </PerformanceProvider>
  </BrowserRouter>
);

// Remove initial native loader after React mounts
const initLoader = document.getElementById("app-init-loader");
if (initLoader) {
  initLoader.remove();
}

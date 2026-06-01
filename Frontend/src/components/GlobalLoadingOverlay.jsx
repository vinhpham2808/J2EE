import { useLoading } from "../context/LoadingContext";
import appLogo from "../assets/logo/favicon.png";

const GlobalLoadingOverlay = () => {
  const { isLoading, loadingMessage } = useLoading();

  if (!isLoading) return null;

  // Case 1: Standard background loads (e.g. tab switches)
  // Display a sleek, non-blocking top progress bar that allows full page interactions
  if (!loadingMessage) {
    return (
      <div className="top-loader-bar" role="progressbar" aria-label="Loading page">
        <div className="top-loader-progress" />
      </div>
    );
  }

  // Case 2: Critical blocking actions (e.g. AI OCR receipt analysis)
  // Display a full-screen blocking overlay with a loading message
  return (
    <div 
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center global-loading-overlay"
      role="status"
      aria-live="polite"
      aria-busy={isLoading}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Spinner ring with logo in center */}
        <div className="global-spinner-wrapper">
          <div className="global-spinner-ring" />
          <img
            src={appLogo}
            alt="Money Manager"
            className="absolute w-8 h-8 rounded-full object-cover"
          />
        </div>
        
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-900/80 px-4 py-2 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 animate-pulse">
          {loadingMessage}
        </p>
      </div>
    </div>
  );
};

export default GlobalLoadingOverlay;

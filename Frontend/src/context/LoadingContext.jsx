import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { registerLoadingHandlers } from "../util/axiosLoadingBridge";

export const LoadingContext = createContext({
  isLoading: false,
  loadingMessage: null,
  showLoading: () => {},
  hideLoading: () => {},
});

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(null);
  
  const counter = useRef(0);
  const showTimeoutRef = useRef(null);

  const showLoading = useCallback((msg = null) => {
    counter.current += 1;
    setLoadingMessage(msg);

    // If it's the first request, set a debounce timer of 450ms before showing loading
    if (counter.current === 1) {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }
      showTimeoutRef.current = setTimeout(() => {
        setIsLoading(true);
      }, 450); // 450ms debounce
    }
  }, []);

  const hideLoading = useCallback(() => {
    counter.current = Math.max(0, counter.current - 1);
    
    if (counter.current === 0) {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }
      setIsLoading(false);
      setLoadingMessage(null);
    }
  }, []);

  // Register loading handlers for Axios interceptor bridge on mount
  useEffect(() => {
    registerLoadingHandlers(showLoading, hideLoading);
    return () => {
      registerLoadingHandlers(null, null);
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }
    };
  }, [showLoading, hideLoading]);

  return (
    <LoadingContext.Provider value={{ isLoading, loadingMessage, showLoading, hideLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);

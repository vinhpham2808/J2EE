import { useEffect } from "react";

/**
 * @param {string} pageTitle - Tiêu đề trang
 * @param {string} [suffix="Money Manager"] - Hậu tố của trang
 */
export const usePageTitle = (pageTitle, suffix = "Money Manager") => {
  useEffect(() => {
    const fullTitle = `${pageTitle} - ${suffix}`;
    document.title = fullTitle;

    // Cleanup: restore to default title
    return () => {
      document.title = "Money Manager";
    };
  }, [pageTitle, suffix]);
};

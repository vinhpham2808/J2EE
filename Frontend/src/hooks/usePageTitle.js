import { useEffect } from "react";

/**
 * Custom hook để đặt tiêu đề trang với hậu tố "- BotDev"
 * @param {string} pageTitle - Tiêu đề trang (không bao gồm "- BotDev")
 */
export const usePageTitle = (pageTitle) => {
  useEffect(() => {
    const fullTitle = `${pageTitle} - BotDev`;
    document.title = fullTitle;

    // Cleanup: restore to default title
    return () => {
      document.title = "Money Manager";
    };
  }, [pageTitle]);
};

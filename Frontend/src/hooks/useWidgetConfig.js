import { useState, useEffect, useCallback } from "react";
import {
  DEFAULT_WIDGET_CONFIG,
  WIDGET_ORDER_KEYS,
} from "../components/dashboard/defaultWidgetConfig";

const STORAGE_PREFIX = "dashboard_widgets_";

const loadConfig = (userId) => {
  if (!userId) return { ...DEFAULT_WIDGET_CONFIG };
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + userId);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge với default để xử lý widget mới thêm về sau
      const merged = { ...DEFAULT_WIDGET_CONFIG };
      for (const key of Object.keys(merged)) {
        if (parsed[key]) {
          merged[key] = { ...merged[key], ...parsed[key] };
        }
      }
      return merged;
    }
  } catch (e) {
    console.warn("Failed to load widget config:", e);
  }
  return { ...DEFAULT_WIDGET_CONFIG };
};

const persistConfig = (userId, config) => {
  if (!userId) return;
  try {
    localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify(config));
  } catch (e) {
    console.warn("Failed to save widget config:", e);
  }
};

export const useWidgetConfig = (userId) => {
  const [widgetConfig, setWidgetConfig] = useState(() => loadConfig(userId));

  // Reload khi userId thay đổi
  useEffect(() => {
    setWidgetConfig(loadConfig(userId));
  }, [userId]);

  // Persist mỗi khi config thay đổi
  useEffect(() => {
    persistConfig(userId, widgetConfig);
  }, [widgetConfig, userId]);

  const toggleWidget = useCallback((widgetId) => {
    setWidgetConfig((prev) => ({
      ...prev,
      [widgetId]: { ...prev[widgetId], visible: !prev[widgetId]?.visible },
    }));
  }, []);

  const reorderWidgets = useCallback((newOrderedIds) => {
    setWidgetConfig((prev) => {
      const updated = { ...prev };
      newOrderedIds.forEach((id, index) => {
        if (updated[id]) {
          updated[id] = { ...updated[id], order: index };
        }
      });
      return updated;
    });
  }, []);

  const resetConfig = useCallback(() => {
    setWidgetConfig({ ...DEFAULT_WIDGET_CONFIG });
  }, []);

  // Danh sách widget draggable sắp xếp theo order
  const sortedWidgetIds = WIDGET_ORDER_KEYS.slice().sort(
    (a, b) => (widgetConfig[a]?.order ?? WIDGET_ORDER_KEYS.indexOf(a)) - (widgetConfig[b]?.order ?? WIDGET_ORDER_KEYS.indexOf(b))
  );

  return {
    widgetConfig,
    sortedWidgetIds,
    toggleWidget,
    reorderWidgets,
    resetConfig,
  };
};

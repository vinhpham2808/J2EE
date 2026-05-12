export const DEFAULT_WIDGET_CONFIG = {
  ai_assistant: { id: "ai_assistant", visible: true },
  kpi_cards: { id: "kpi_cards", visible: true, order: 0 },
  monthly_history: { id: "monthly_history", visible: true, order: 1 },
  recent_transactions: { id: "recent_transactions", visible: true, order: 2 },
  finance_overview: { id: "finance_overview", visible: true, order: 3 },
  budget_progress: { id: "budget_progress", visible: true, order: 4 },
  priority_goal: { id: "priority_goal", visible: true, order: 5 },
};

export const WIDGET_ORDER_KEYS = [
  "kpi_cards",
  "monthly_history",
  "recent_transactions",
  "finance_overview",
  "budget_progress",
  "priority_goal",
];

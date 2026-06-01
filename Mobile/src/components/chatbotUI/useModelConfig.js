import { useState, useMemo, useCallback, useContext } from "react";
import { Alert } from "react-native";
import { AuthContext } from "../AuthContext";

// ─── Model & provider configuration ─────────────────────

const MODELS = {
  chat: {
    ninerouter: { provider: "ninerouter", model: "project-demo", label: "Nova Lite" },
    gptoss:     { provider: "gptoss",     model: "gpt-oss-120b", label: "GPT-OSS 120B" }
  },
  agent: {
    ninerouter: { provider: "ninerouter", model: "gemma4-31B",          label: "Nova Lite" },
    gemini:     { provider: "gemini",     model: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash" }
  }
};

const CHAT_OPTIONS = [
  { label: "Nova Lite",     value: "ninerouter", icon: "✦", description: "Nhanh · tiết kiệm" },
  { label: "GPT-OSS 120B",  value: "gptoss",     icon: "✧", description: "Mạnh · phân tích sâu", disabled: false, badge: null }
];

const AGENT_OPTIONS = [
  { label: "Gemini 3.1 Flash", value: "gemini",     icon: "🤖", description: "Nhanh · thông minh · tiết kiệm", disabled: false, badge: null },
  { label: "Nova Lite",        value: "ninerouter", icon: "✦",  description: "Nhanh · tiết kiệm" }
];

/**
 * useModelConfig — Quản lý mode (chat/agent), model, provider và premium gating.
 *
 * Returns:
 *   activeMode, chatModel, agentModel
 *   activeProvider, activeModel, activeModelLabel
 *   modelOptions (theo mode), modelValue, modelLabel
 *   inputPlaceholder
 *   handleModeSwitch, handleModelChange
 */
export default function useModelConfig() {
  const { user } = useContext(AuthContext);

  const isFreePlan    = !user?.subscriptionPlan || user?.subscriptionPlan === "FREE";
  const isPremiumPlan = user?.subscriptionPlan === "PREMIUM";

  const [activeMode, setActiveMode] = useState("chat");
  const [chatModel, setChatModel]   = useState("gptoss");
  const [agentModel, setAgentModel] = useState("gemini");

  // ── Derived ────────────────────────────────────────────

  const activeParams = useMemo(() => {
    const modeConfig = activeMode === "agent" ? MODELS.agent : MODELS.chat;
    const key        = activeMode === "agent" ? agentModel : chatModel;
    return modeConfig[key] || modeConfig.ninerouter;
  }, [activeMode, chatModel, agentModel]);

  const modelOptions = useMemo(() => {
    const options = activeMode === "chat" ? CHAT_OPTIONS : AGENT_OPTIONS;
    if (isPremiumPlan) return options;
    // Free/Basic: chỉ ninerouter available, các model khác bị lock
    return options.map((opt) =>
      opt.value === "ninerouter"
        ? opt
        : { ...opt, disabled: true, badge: "PREMIUM" }
    );
  }, [activeMode, isPremiumPlan]);

  const modelValue = activeMode === "chat" ? chatModel : agentModel;

  const inputPlaceholder = activeMode === "agent"
    ? "Tạo/sửa/xóa dữ liệu, xuất excel..."
    : "Trò chuyện, hỏi đáp tài chính...";

  // ── Handlers ───────────────────────────────────────────

  const handleModeSwitch = useCallback((mode) => {
    if (mode === activeMode) return;
    if (mode === "agent" && isFreePlan) {
      Alert.alert(
        "Yêu cầu gói BASIC trở lên",
        "Tính năng Agent của Nova Money (Tạo/sửa/xóa dữ liệu tự động) chỉ khả dụng cho gói BASIC trở lên. Vui lòng nâng cấp gói để sử dụng.",
        [{ text: "Đóng", style: "cancel" }]
      );
      return;
    }
    setActiveMode(mode);
  }, [activeMode, isFreePlan]);

  const handleModelChange = useCallback((model) => {
    if (model === modelValue) return;
    if (!isPremiumPlan && model !== "ninerouter") return;

    if (activeMode === "chat") {
      setChatModel(model);
    } else {
      setAgentModel(model);
    }
  }, [activeMode, modelValue, isPremiumPlan]);

  return {
    // State
    activeMode,
    chatModel,
    agentModel,
    // Derived
    activeProvider:   activeParams.provider,
    activeModel:      activeParams.model,
    activeModelLabel: activeParams.label,
    modelOptions,
    modelValue,
    modelLabel:       activeParams.label,
    inputPlaceholder,
    // Permissions
    isFreePlan,
    isPremiumPlan,
    // Handlers
    handleModeSwitch,
    handleModelChange
  };
}

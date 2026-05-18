/**
 * AI Insight Feature — Mobile
 *
 * Usage in DashboardScreen.js:
 *
 *   import { AiInsightButton, AiInsightSheet, AiInsightLockedModal, useAiInsight } from "../features/ai-insight";
 *
 *   const ai = useAiInsight();
 *
 *   // In section header:
 *   <AiInsightButton onPress={ai.openSheet} />
 *
 *   // At bottom of screen:
 *   <AiInsightSheet
 *     visible={ai.visible}
 *     onClose={ai.closeSheet}
 *     insight={ai.insight}
 *     loading={ai.loading}
 *     error={ai.error}
 *     isPremium={ai.isPremium}
 *     detailedInsight={ai.detailedInsight}
 *     detailedLoading={ai.detailedLoading}
 *     detailedError={ai.detailedError}
 *     showDetailed={ai.showDetailed}
 *     onLoadDetailed={ai.loadDetailed}
 *     onRetry={ai.retry}
 *   />
 *   <AiInsightLockedModal
 *     visible={lockVisible}
 *     onClose={() => setLockVisible(false)}
 *   />
 */

export { useAiInsight } from "./hooks/useAiInsight";
export { default as AiInsightButton } from "./components/AiInsightButton";
export { default as AiInsightSheet } from "./components/AiInsightSheet";
export { default as AiInsightLockedModal } from "./components/AiInsightLockedModal";

import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AiInsightLockedModal from "../components/Ai_Insight/AiInsightLockedModal";
import AiInsightSheet from "../components/Ai_Insight/AiInsightSheet";
import FinanceOverviewSection from "../components/Dashboard/FinanceOverviewSection";
import RecentTransactionsSection from "../components/Dashboard/RecentTransactionsSection";
import GoalsPreview from "../components/Dashboard/GoalsPreview";
import HomeBanner from "../components/HomeBanner";
import HomeTopHeader from "../components/HomeTopHeader";
import NotificationModal from "../components/NotificationModal";
import { useVisibleItems } from "../components/ShowMoreButton";
import { COLORS } from "../constants/colors";
import { useAiInsight } from "../hooks/useAiInsight";
import useDashboard from "../hooks/useDashboard";
import { scale } from "../utils/dimensions";
import { getSafeAreaBottom } from "../utils/safeAreaSpacing";

export default function DashboardScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dashboard = useDashboard();
  const ai = useAiInsight();
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [aiLockVisible, setAiLockVisible] = useState(false);

  const {
    visibleItems: recentTransactions,
    canToggle: canExpandRecentTransactions,
    expanded: showAllRecentTransactions,
    toggle: toggleRecentTransactions
  } = useVisibleItems(dashboard.recentTransactions, { initialCount: 4, mode: "toggle" });

  const handleAiPress = () => {
    if (ai.isPremium) {
      ai.openSheet();
    } else {
      setAiLockVisible(true);
    }
  };

  const handleAiConfirm = useCallback(() => {
    const draft = ai.confirmAnalysis();
    if (draft) {
      navigation.navigate("Forecast", {
        year: draft.year,
        month: draft.month,
        source: "ai-insight",
        draftSavedAt: draft.savedAt
      });
    }
  }, [ai, navigation]);

  const goToGoals = useCallback(() => {
    navigation.navigate("Goal");
  }, [navigation]);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: getSafeAreaBottom(insets) }]}
        refreshControl={<RefreshControl refreshing={dashboard.refreshing} onRefresh={dashboard.onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <HomeTopHeader
          onMenuPress={() => navigation.navigate("SettingTab", { screen: "Profile" })}
          onBellPress={() => setNotificationVisible(true)}
          unreadCount={dashboard.unreadCount}
        />
        <HomeBanner />

        <FinanceOverviewSection
          dashboard={dashboard.dashboard}
          monthlySeries={dashboard.monthlySeries}
          onAiPress={handleAiPress}
        />

        <GoalsPreview
          goals={dashboard.goals}
          onCreate={goToGoals}
          onGoalPress={goToGoals}
          onMore={goToGoals}
        />

        <RecentTransactionsSection
          canToggle={canExpandRecentTransactions}
          expanded={showAllRecentTransactions}
          onToggle={toggleRecentTransactions}
          transactions={recentTransactions}
        />
      </ScrollView>

      <NotificationModal
        visible={notificationVisible}
        onClose={() => setNotificationVisible(false)}
        onUnreadCountChange={dashboard.setUnreadCount}
      />

      <AiInsightSheet
        visible={ai.visible}
        onClose={ai.closeSheet}
        selectedMonth={ai.selectedMonth}
        selectedYear={ai.selectedYear}
        availableMonths={ai.availableMonths}
        goToPrevMonth={ai.goToPrevMonth}
        goToNextMonth={ai.goToNextMonth}
        canGoPrev={ai.canGoPrev}
        canGoNext={ai.canGoNext}
        result={ai.result}
        loading={ai.loading}
        error={ai.error}
        isIdle={ai.isIdle}
        isPremium={ai.isPremium}
        onAnalyze={ai.analyze}
        onRetry={ai.retry}
        onConfirm={handleAiConfirm}
      />

      <AiInsightLockedModal visible={aiLockVisible} onClose={() => setAiLockVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG
  },
  content: {
    padding: scale(14),
    paddingBottom: scale(22),
    gap: scale(10)
  }
});

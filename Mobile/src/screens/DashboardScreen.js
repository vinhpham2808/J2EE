import React, { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import HomeTopHeader from "../components/HomeTopHeader";
import HomeBanner from "../components/HomeBanner";
import FinanceOverviewChart from "../components/FinanceOverviewChart";
import NotificationModal from "../components/NotificationModal";
import http from "../services/http";
import { API_ENDPOINTS } from "../constants/api";
import { buildMonthlyFinanceSeries } from "../utils/financeStats";
import { formatDate, formatMoney, getApiErrorMessage } from "../utils/format";
import { COLORS } from "../constants/colors";
import {
  AiInsightButton,
  AiInsightSheet,
  AiInsightLockedModal,
  useAiInsight,
} from "../features/ai-insight";

function SectionHeader({ title, onMore }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onMore ? (
        <Pressable onPress={onMore}>
          <Text style={styles.sectionMore}>Xem thêm</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function TransactionRow({ item }) {
  const isIncome = String(item?.type || "").toUpperCase().includes("INCOME");
  const amountColor = isIncome ? COLORS.INCOME : COLORS.EXPENSE;
  const sign = isIncome ? "+" : "-";

  return (
    <View style={styles.transactionRow}>
      <View style={styles.transactionLeft}>
        <View style={styles.transactionIconWrap}>
          <Text style={styles.transactionIcon}>{item?.icon || "🧾"}</Text>
        </View>
        <View>
          <Text style={styles.transactionName}>{item?.name || "Giao dịch"}</Text>
          <Text style={styles.transactionDate}>{formatDate(item?.date)}</Text>
        </View>
      </View>
      <Text style={[styles.transactionAmount, { color: amountColor }]}>{sign}{formatMoney(item?.amount)}</Text>
    </View>
  );
}

function SavingGoalCard({ goal, onPress }) {
  const target = Number(goal?.targetAmount || 0);
  const current = Number(goal?.currentAmount || 0);
  const progress = Math.max(0, Math.min(100, Number(goal?.progressPercent || 0)));
  const status = String(goal?.status || "ACTIVE").toUpperCase();

  const isCompleted = status === "COMPLETED";
  const progressColor = isCompleted ? COLORS.PRIMARY : progress >= 50 ? COLORS.PRIMARY : progress >= 25 ? COLORS.GOLD : COLORS.INFO;

  return (
    <Pressable style={styles.savingGoalCard} onPress={onPress}>
      <View style={styles.savingGoalHeader}>
        <View style={styles.savingGoalInfo}>
          <Text style={styles.savingGoalName} numberOfLines={1}>{goal?.name || "Mục tiêu"}</Text>
          <Text style={styles.savingGoalStatus}>
            {isCompleted ? "Hoàn thành" : `Đang tích lũy · ${formatMoney(current)} / ${formatMoney(target)}`}
          </Text>
        </View>
        <Text style={[styles.savingGoalPercent, { color: progressColor }]}>{Math.round(progress)}%</Text>
      </View>
      <View style={styles.savingGoalTrack}>
        <View style={[styles.savingGoalFill, { width: `${progress}%`, backgroundColor: progressColor }]} />
      </View>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [dashboard, setDashboard] = useState(null);
  const [savingGoals, setSavingGoals] = useState([]);
  const [monthlySeries, setMonthlySeries] = useState([]);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // ── AI Insight ─────────────────────────────────────────────
  const ai = useAiInsight();
  const [aiLockVisible, setAiLockVisible] = useState(false);

  const handleAiPress = () => {
    if (ai.isPremium) {
      ai.openSheet();
    } else {
      setAiLockVisible(true);
    }
  };

  const fetchDashboard = useCallback(async () => {
    const response = await http.get(API_ENDPOINTS.DASHBOARD_DATA);
    setDashboard(response.data || null);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await http.get(API_ENDPOINTS.GET_UNREAD_COUNT);
      setUnreadCount(Number(response.data?.unreadCount || 0));
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const fetchSavingGoals = useCallback(async () => {
    try {
      const response = await http.get(API_ENDPOINTS.GET_SAVING_GOALS);
      const goals = Array.isArray(response.data) ? response.data : [];
      // Only show active goals, max 3
      const activeGoals = goals
        .filter(g => String(g?.status || "ACTIVE").toUpperCase() === "ACTIVE")
        .slice(0, 3);
      setSavingGoals(activeGoals);
    } catch {
      setSavingGoals([]);
    }
  }, []);

  const fetchMonthlyFinanceSeries = useCallback(async () => {
    const [incomeRes, expenseRes] = await Promise.all([
      http.get(API_ENDPOINTS.GET_ALL_INCOMES, { params: { all: true } }),
      http.get(API_ENDPOINTS.GET_ALL_EXPENSE)
    ]);

    const incomes = Array.isArray(incomeRes.data) ? incomeRes.data : [];
    const expenses = Array.isArray(expenseRes.data) ? expenseRes.data : [];
    setMonthlySeries(buildMonthlyFinanceSeries({ incomes, expenses, monthsBack: 6 }));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchDashboard(), fetchSavingGoals(), fetchMonthlyFinanceSeries(), fetchUnreadCount()]);
    } catch (error) {
      Alert.alert("Lỗi", getApiErrorMessage(error, "Không tải được dữ liệu trang chủ"));
    } finally {
      setRefreshing(false);
    }
  }, [fetchDashboard, fetchSavingGoals, fetchMonthlyFinanceSeries, fetchUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      onRefresh();
    }, [onRefresh])
  );

  const recentTransactions = useMemo(
    () => (dashboard?.recentTransactions || []).slice(0, 5),
    [dashboard?.recentTransactions]
  );

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <HomeTopHeader
          onMenuPress={() => navigation.navigate("SettingTab")}
          onBellPress={() => setNotificationVisible(true)}
          unreadCount={unreadCount}
        />
        <HomeBanner />

        {/* Finance Overview Section */}
        <View style={styles.financeHeaderRow}>
          <SectionHeader title="Tổng quan tài chính" />
          <AiInsightButton onPress={handleAiPress} style={styles.aiButtonSpacing} />
        </View>
        <FinanceOverviewChart
          totalBalance={dashboard?.totalBalance}
          totalIncome={dashboard?.totalIncome}
          totalExpense={dashboard?.totalExpense}
          monthlySeries={monthlySeries}
        />

        {/* Saving Goals Section */}
        <SectionHeader title="Mục tiêu tiết kiệm" onMore={() => navigation.navigate("SavingGoal")} />
        <View style={styles.sectionCard}>
          {savingGoals.length > 0 ? (
            savingGoals.map((goal) => (
              <SavingGoalCard
                key={goal.id}
                goal={goal}
                onPress={() => navigation.navigate("SavingGoal")}
              />
            ))
          ) : (
            <View style={styles.emptyGoalContainer}>
              <Text style={styles.emptyGoalIcon}>🎯</Text>
              <Text style={styles.emptyGoalText}>Chưa có mục tiêu tiết kiệm nào.</Text>
              <Pressable
                style={styles.createGoalButton}
                onPress={() => navigation.navigate("SavingGoal")}
              >
                <Text style={styles.createGoalButtonText}>Tạo mục tiêu</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Recent Transactions Section */}
        <SectionHeader title="Giao dịch gần đây" onMore={() => navigation.navigate("ExpenseTab")} />
        <View style={styles.sectionCard}>
          {recentTransactions.length ? (
            recentTransactions.map((item) => <TransactionRow key={item.id || `${item.name}-${item.date}`} item={item} />)
          ) : (
            <Text style={styles.emptyText}>Chưa có giao dịch gần đây.</Text>
          )}
        </View>
      </ScrollView>

      <NotificationModal
        visible={notificationVisible}
        onClose={() => setNotificationVisible(false)}
        onUnreadCountChange={setUnreadCount}
      />

      {/* ── AI Insight Sheet ──────────────────────────────── */}
      <AiInsightSheet
        visible={ai.visible}
        onClose={ai.closeSheet}
        insight={ai.insight}
        loading={ai.loading}
        error={ai.error}
        isPremium={ai.isPremium}
        detailedInsight={ai.detailedInsight}
        detailedLoading={ai.detailedLoading}
        detailedError={ai.detailedError}
        showDetailed={ai.showDetailed}
        onLoadDetailed={ai.loadDetailed}
        onRetry={ai.retry}
      />

      {/* ── AI Insight Locked Modal ────────────────────────── */}
      <AiInsightLockedModal
        visible={aiLockVisible}
        onClose={() => setAiLockVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG
  },
  content: {
    padding: 14,
    paddingBottom: 22,
    gap: 10
  },
  financeHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aiButtonSpacing: {
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6
  },
  sectionTitle: {
    color: COLORS.TEXT,
    fontSize: 17,
    fontWeight: "800"
  },
  sectionMore: {
    color: COLORS.PRIMARY,
    fontSize: 13,
    fontWeight: "700"
  },
  sectionCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 12
  },

  // Transaction styles
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BG
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 8
  },
  transactionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.ROSE_MIST,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
  },
  transactionIcon: {
    fontSize: 16,
  },
  transactionName: {
    color: COLORS.TEXT,
    fontWeight: "700",
    fontSize: 14
  },
  transactionDate: {
    color: COLORS.TEXT_MUTED,
    marginTop: 2,
    fontSize: 12
  },
  transactionAmount: {
    fontWeight: "800",
    fontSize: 13
  },
  emptyText: {
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    paddingVertical: 16,
  },

  // Saving Goal Card styles
  savingGoalCard: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BG,
  },
  savingGoalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  savingGoalInfo: {
    flex: 1,
    paddingRight: 10,
  },
  savingGoalName: {
    color: COLORS.TEXT,
    fontWeight: "700",
    fontSize: 14,
  },
  savingGoalStatus: {
    color: COLORS.TEXT_MUTED,
    fontSize: 12,
    marginTop: 2,
  },
  savingGoalPercent: {
    fontSize: 18,
    fontWeight: "900",
  },
  savingGoalTrack: {
    height: 6,
    borderRadius: 6,
    backgroundColor: COLORS.CARD_BORDER,
    overflow: "hidden",
  },
  savingGoalFill: {
    height: "100%",
    borderRadius: 6,
  },

  // Empty goal state
  emptyGoalContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  emptyGoalIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  emptyGoalText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    marginBottom: 10,
  },
  createGoalButton: {
    backgroundColor: COLORS.ROSE_MIST,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  createGoalButtonText: {
    color: COLORS.PRIMARY,
    fontWeight: "700",
    fontSize: 13,
  },
});

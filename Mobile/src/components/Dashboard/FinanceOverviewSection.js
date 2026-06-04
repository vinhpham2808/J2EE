import React from "react";
import { StyleSheet } from "react-native";
import AiInsightButton from "../Ai_Insight/AiInsightButton";
import FinanceOverviewChart from "./FinanceOverviewChart";
import { DashboardSectionHeader } from "./DashboardSection";
import { scale } from "../../utils/layoutScale";

export default function FinanceOverviewSection({ dashboard, monthlySeries, onAiPress }) {
  return (
    <>
      <DashboardSectionHeader title="Tổng quan tài chính">
        <AiInsightButton onPress={onAiPress} style={styles.aiButtonSpacing} />
      </DashboardSectionHeader>
      <FinanceOverviewChart
        totalBalance={dashboard?.totalBalance}
        totalIncome={dashboard?.totalIncome}
        totalExpense={dashboard?.totalExpense}
        monthlySeries={monthlySeries}
      />
    </>
  );
}

const styles = StyleSheet.create({
  aiButtonSpacing: {
    marginLeft: scale(8)
  }
});

package com.example.moneymanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MonthlyReportCardDTO {

    private int month;
    private int year;
    private String monthName;

    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal savings;
    private double savingsRate;

    private String grade;
    private String gradeLabel;

    private BigDecimal prevMonthIncome;
    private BigDecimal prevMonthExpense;
    private BigDecimal prevMonthSavings;
    private double spendingChangePercent;

    private List<CategoryBreakdownItem> categoryBreakdown;

    private int completedGoalsThisMonth;
    private int totalActiveGoals;
    private int budgetsOnTrack;
    private int totalBudgets;

    private List<String> badges;
    private List<String> strengths;
    private List<String> improvements;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class CategoryBreakdownItem {
        private String name;
        private BigDecimal amount;
        private double percent;
        private String icon;
        private String color;
    }

    // Grade calculation constants
    public static final String GRADE_A = "A";
    public static final String GRADE_B = "B";
    public static final String GRADE_C = "C";
    public static final String GRADE_D = "D";
    public static final String GRADE_F = "F";

    public static final double THRESHOLD_A = 0.30;  // > 30%
    public static final double THRESHOLD_B = 0.20;  // 20-30%
    public static final double THRESHOLD_C = 0.10;  // 10-20%
    public static final double THRESHOLD_D = 0.0;   // 0-10%
    // Below 0% is F
}

package com.example.moneymanager.service;

import com.example.moneymanager.dto.AssistantChatResponseDTO;
import com.example.moneymanager.dto.ForecastDTOs.*;
import com.example.moneymanager.entity.CategoryEntity;
import com.example.moneymanager.entity.ExpenseEntity;
import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.repository.ExpenseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ForecastServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;
    @Mock
    private GptOssService gptOssService;
    @Mock
    private SubscriptionService subscriptionService;
    @Mock
    private ProfileService profileService;

    @InjectMocks
    private ForecastService forecastService;

    private ProfileEntity profile;
    private CategoryEntity category;

    @BeforeEach
    void setUp() {
        profile = new ProfileEntity();
        profile.setId(1L);

        category = new CategoryEntity();
        category.setId(10L);
        category.setName("Food");

        when(profileService.getCurrentProfile()).thenReturn(profile);
        doNothing().when(subscriptionService).ensureCanUseForecast(any());
    }

    // ── getMonthlyForecast ──────────────────────────────────────────────────

    @Test
    void getMonthlyForecast_trendUP_whenLastMonthExceedsAvgBy10Percent() {
        // May 2026 target → history window: Nov 2025 – Apr 2026
        // Last month = Apr 2026 with 200 (> avg * 1.1)
        // Previous 5 months with 100 each → avg = (5*100 + 200) / 6 = 116.67
        // But leave-one-out style: avg computed from all 6, lastMonth vs avg
        // Let's use: 5 months at 100, Apr at 200 → avg = (500+200)/6 = 116.67
        // 200 > 116.67 * 1.1 = 128.33 → UP

        List<ExpenseEntity> expenses = List.of(
                expense(1L, category, new BigDecimal("100"), LocalDate.of(2025, 11, 15)),
                expense(2L, category, new BigDecimal("100"), LocalDate.of(2025, 12, 15)),
                expense(3L, category, new BigDecimal("100"), LocalDate.of(2026, 1, 15)),
                expense(4L, category, new BigDecimal("100"), LocalDate.of(2026, 2, 15)),
                expense(5L, category, new BigDecimal("100"), LocalDate.of(2026, 3, 15)),
                expense(6L, category, new BigDecimal("200"), LocalDate.of(2026, 4, 15))
        );

        when(expenseRepository.findByProfileIdAndDateBetween(eq(1L), any(), any()))
                .thenReturn(expenses);

        MonthlyForecastDTO result = forecastService.getMonthlyForecast(2026, 5);

        assertThat(result.getCategories()).hasSize(1);
        assertThat(result.getCategories().get(0).getTrend()).isEqualTo("UP");
    }

    @Test
    void getMonthlyForecast_trendDOWN_whenLastMonthBelowAvgBy10Percent() {
        // 5 months at 100, Apr at 20 → avg = (500+20)/6 = 86.67
        // 20 < 86.67 * 0.9 = 78.0 → DOWN
        List<ExpenseEntity> expenses = List.of(
                expense(1L, category, new BigDecimal("100"), LocalDate.of(2025, 11, 15)),
                expense(2L, category, new BigDecimal("100"), LocalDate.of(2025, 12, 15)),
                expense(3L, category, new BigDecimal("100"), LocalDate.of(2026, 1, 15)),
                expense(4L, category, new BigDecimal("100"), LocalDate.of(2026, 2, 15)),
                expense(5L, category, new BigDecimal("100"), LocalDate.of(2026, 3, 15)),
                expense(6L, category, new BigDecimal("20"), LocalDate.of(2026, 4, 15))
        );

        when(expenseRepository.findByProfileIdAndDateBetween(eq(1L), any(), any()))
                .thenReturn(expenses);

        MonthlyForecastDTO result = forecastService.getMonthlyForecast(2026, 5);

        assertThat(result.getCategories()).hasSize(1);
        assertThat(result.getCategories().get(0).getTrend()).isEqualTo("DOWN");
    }

    @Test
    void getMonthlyForecast_trendSTABLE_whenLastMonthWithinAvgRange() {
        // All months at 100, avg = 100, last month = 100 → STABLE
        List<ExpenseEntity> expenses = List.of(
                expense(1L, category, new BigDecimal("100"), LocalDate.of(2025, 11, 15)),
                expense(2L, category, new BigDecimal("100"), LocalDate.of(2025, 12, 15)),
                expense(3L, category, new BigDecimal("100"), LocalDate.of(2026, 1, 15)),
                expense(4L, category, new BigDecimal("100"), LocalDate.of(2026, 2, 15)),
                expense(5L, category, new BigDecimal("100"), LocalDate.of(2026, 3, 15)),
                expense(6L, category, new BigDecimal("100"), LocalDate.of(2026, 4, 15))
        );

        when(expenseRepository.findByProfileIdAndDateBetween(eq(1L), any(), any()))
                .thenReturn(expenses);

        MonthlyForecastDTO result = forecastService.getMonthlyForecast(2026, 5);

        assertThat(result.getCategories()).hasSize(1);
        assertThat(result.getCategories().get(0).getTrend()).isEqualTo("STABLE");
    }

    @Test
    void getMonthlyForecast_returnsEmptyCategories_whenNoHistoricalData() {
        when(expenseRepository.findByProfileIdAndDateBetween(anyLong(), any(), any()))
                .thenReturn(List.of());

        MonthlyForecastDTO result = forecastService.getMonthlyForecast(2026, 5);

        assertThat(result.getCategories()).isEmpty();
        assertThat(result.getYear()).isEqualTo(2026);
        assertThat(result.getMonth()).isEqualTo(5);
    }

    @Test
    void getMonthlyForecast_predictedAmountIncreasedBy5Percent_whenTrendUP() {
        List<ExpenseEntity> expenses = List.of(
                expense(1L, category, new BigDecimal("100"), LocalDate.of(2025, 11, 15)),
                expense(2L, category, new BigDecimal("100"), LocalDate.of(2025, 12, 15)),
                expense(3L, category, new BigDecimal("100"), LocalDate.of(2026, 1, 15)),
                expense(4L, category, new BigDecimal("100"), LocalDate.of(2026, 2, 15)),
                expense(5L, category, new BigDecimal("100"), LocalDate.of(2026, 3, 15)),
                expense(6L, category, new BigDecimal("200"), LocalDate.of(2026, 4, 15))
        );
        when(expenseRepository.findByProfileIdAndDateBetween(eq(1L), any(), any()))
                .thenReturn(expenses);

        MonthlyForecastDTO result = forecastService.getMonthlyForecast(2026, 5);

        CategoryForecastItem item = result.getCategories().get(0);
        // predicted = avg * 1.05
        assertThat(item.getPredictedAmount())
                .isEqualByComparingTo(item.getHistoricalAverage().multiply(new BigDecimal("1.05")));
    }

    // ── detectAnomalies ─────────────────────────────────────────────────────

    @Test
    void detectAnomalies_flagsExpense_whenAmountExceedsMeanPlusTwoStdDevAndAbove50k() {
        // 4 normal expenses at 100k each, 1 anomaly at 1,000,000
        // mean of others (4×100k) = 100,000, stdDev ≈ 0 → anomaly at 1,000,000 > mean+2*stdDev
        LocalDate recent = LocalDate.now().minusDays(5);

        List<ExpenseEntity> expenses = List.of(
                expense(1L, category, new BigDecimal("100000"), recent),
                expense(2L, category, new BigDecimal("100000"), recent),
                expense(3L, category, new BigDecimal("100000"), recent),
                expense(4L, category, new BigDecimal("100000"), recent),
                expense(5L, category, new BigDecimal("1000000"), recent)
        );

        when(expenseRepository.findByProfileIdAndDateBetween(eq(1L), any(), any()))
                .thenReturn(expenses);

        List<AnomalyDTO> anomalies = forecastService.detectAnomalies();

        assertThat(anomalies).isNotEmpty();
        assertThat(anomalies.get(0).getAmount()).isEqualByComparingTo(new BigDecimal("1000000"));
        assertThat(anomalies.get(0).getCategoryName()).isEqualTo("Food");
        assertThat(anomalies.get(0).getType()).isEqualTo("EXPENSE");
    }

    @Test
    void detectAnomalies_skipsCategory_whenFewerThanThreeTransactions() {
        LocalDate recent = LocalDate.now().minusDays(5);
        List<ExpenseEntity> expenses = List.of(
                expense(1L, category, new BigDecimal("100000"), recent),
                expense(2L, category, new BigDecimal("5000000"), recent)
        );

        when(expenseRepository.findByProfileIdAndDateBetween(eq(1L), any(), any()))
                .thenReturn(expenses);

        List<AnomalyDTO> anomalies = forecastService.detectAnomalies();

        assertThat(anomalies).isEmpty();
    }

    @Test
    void detectAnomalies_doesNotFlag_whenAnomalousAmountIsAt50000OrBelow() {
        // stdDev ≈ 0 for equal values, but the "anomaly" is at exactly 50000
        // The condition requires amount > 50000, so 50000 should NOT be flagged
        LocalDate recent = LocalDate.now().minusDays(5);

        // 4 small amounts near zero, 1 at 50000 – would be anomalous by z-score but <= 50k
        List<ExpenseEntity> expenses = List.of(
                expense(1L, category, new BigDecimal("100"), recent),
                expense(2L, category, new BigDecimal("100"), recent),
                expense(3L, category, new BigDecimal("100"), recent),
                expense(4L, category, new BigDecimal("100"), recent),
                expense(5L, category, new BigDecimal("50000"), recent)
        );

        when(expenseRepository.findByProfileIdAndDateBetween(eq(1L), any(), any()))
                .thenReturn(expenses);

        List<AnomalyDTO> anomalies = forecastService.detectAnomalies();

        // 50000 is NOT strictly > 50000, so must not be flagged
        assertThat(anomalies).isEmpty();
    }

    @Test
    void detectAnomalies_limitsResultsToFive() {
        // Create 10 anomalous expenses across different categories
        LocalDate recent = LocalDate.now().minusDays(5);
        List<ExpenseEntity> expenses = new java.util.ArrayList<>();

        // 3 categories, each with 3 normals + 1 anomaly is only 4 anomalies max
        // We'll use one category with 3 normals + 7 anomalies to get >5
        for (int i = 1; i <= 3; i++) {
            expenses.add(expense((long) i, category, new BigDecimal("100000"), recent.minusDays(i)));
        }
        for (int i = 4; i <= 10; i++) {
            expenses.add(expense((long) i, category, new BigDecimal("9999999"), recent.minusDays(i)));
        }

        when(expenseRepository.findByProfileIdAndDateBetween(eq(1L), any(), any()))
                .thenReturn(expenses);

        List<AnomalyDTO> anomalies = forecastService.detectAnomalies();

        assertThat(anomalies).hasSizeLessThanOrEqualTo(5);
    }

    // ── getCategoryTrend ─────────────────────────────────────────────────────

    @Test
    void getCategoryTrend_returnsDataPointForEachMonth() {
        int months = 3;
        LocalDate now = LocalDate.now();
        LocalDate start = now.minusMonths(months).withDayOfMonth(1);

        List<ExpenseEntity> expenses = List.of(
                expense(1L, category, new BigDecimal("500"), start.plusDays(5))
        );

        when(expenseRepository.findByProfileIdAndDateBetween(eq(1L), any(), any()))
                .thenReturn(expenses);

        CategoryTrendDTO result = forecastService.getCategoryTrend(10L, months);

        // Should have months+1 data points (inclusive of current month)
        assertThat(result.getDataPoints()).hasSizeGreaterThanOrEqualTo(months);
        assertThat(result.getCategoryName()).isEqualTo("Food");
    }

    @Test
    void getCategoryTrend_fillsZeroForMonthsWithNoExpenses() {
        int months = 6;
        LocalDate now = LocalDate.now();

        // Only one month has data
        List<ExpenseEntity> expenses = List.of(
                expense(1L, category, new BigDecimal("300"), now.minusMonths(1).withDayOfMonth(10))
        );

        when(expenseRepository.findByProfileIdAndDateBetween(eq(1L), any(), any()))
                .thenReturn(expenses);

        CategoryTrendDTO result = forecastService.getCategoryTrend(10L, months);

        long zeroMonths = result.getDataPoints().stream()
                .filter(dp -> dp.getActual().compareTo(BigDecimal.ZERO) == 0)
                .count();

        assertThat(zeroMonths).isGreaterThanOrEqualTo(months - 1);
    }

    @Test
    void getCategoryTrend_returnsCategoryNameUnknown_whenNoMatchingExpenses() {
        CategoryEntity otherCategory = new CategoryEntity();
        otherCategory.setId(99L);
        otherCategory.setName("Other");

        List<ExpenseEntity> expenses = List.of(
                expense(1L, otherCategory, new BigDecimal("100"), LocalDate.now().minusDays(10))
        );

        when(expenseRepository.findByProfileIdAndDateBetween(eq(1L), any(), any()))
                .thenReturn(expenses);

        // Request trend for category 10L, but all expenses belong to category 99L
        CategoryTrendDTO result = forecastService.getCategoryTrend(10L, 3);

        assertThat(result.getCategoryName()).isEqualTo("Unknown");
    }

    // ── getGeminiInsights ────────────────────────────────────────────────────

    @Test
    void getGeminiInsights_returnsNarrativeFromGemini() {
        MonthlyForecastDTO forecast = MonthlyForecastDTO.builder()
                .year(2026)
                .month(5)
                .categories(List.of(
                        CategoryForecastItem.builder()
                                .categoryId(10L)
                                .categoryName("Food")
                                .predictedAmount(new BigDecimal("1200000"))
                                .historicalAverage(new BigDecimal("1000000"))
                                .trend("UP")
                                .build()
                ))
                .build();

        when(gptOssService.chat(any())).thenReturn(
                AssistantChatResponseDTO.builder().reply("Hãy cắt giảm chi tiêu ăn uống.").build()
        );

        ForecastInsightDTO result = forecastService.getGeminiInsights(forecast);

        assertThat(result.getNarrative()).isEqualTo("Hãy cắt giảm chi tiêu ăn uống.");
        assertThat(result.getGeneratedAt()).isNotNull();
        verify(gptOssService).chat(any());
    }

    @Test
    void getGeminiInsights_includesCategoryDataInPrompt() {
        MonthlyForecastDTO forecast = MonthlyForecastDTO.builder()
                .year(2026).month(5)
                .categories(List.of(
                        CategoryForecastItem.builder()
                                .categoryId(10L).categoryName("Transport")
                                .predictedAmount(new BigDecimal("500000"))
                                .historicalAverage(new BigDecimal("500000"))
                                .trend("STABLE")
                                .build()
                ))
                .build();

        when(gptOssService.chat(any())).thenReturn(
                AssistantChatResponseDTO.builder().reply("OK").build()
        );

        forecastService.getGeminiInsights(forecast);

        verify(gptOssService).chat(argThat(prompt ->
                prompt.contains("Transport") && prompt.contains("5/2026")
        ));
    }

    // ── helper ──────────────────────────────────────────────────────────────

    private ExpenseEntity expense(Long id, CategoryEntity cat, BigDecimal amount, LocalDate date) {
        ExpenseEntity e = new ExpenseEntity();
        e.setId(id);
        e.setCategory(cat);
        e.setAmount(amount);
        e.setDate(date);
        e.setProfile(profile);
        return e;
    }
}

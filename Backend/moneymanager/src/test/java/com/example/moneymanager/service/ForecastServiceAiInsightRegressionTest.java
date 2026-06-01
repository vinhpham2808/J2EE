package com.example.moneymanager.service;

import com.example.moneymanager.dto.ForecastDTOs.CategoryForecastItem;
import com.example.moneymanager.dto.ForecastDTOs.ForecastInsightDTO;
import com.example.moneymanager.dto.ForecastDTOs.MonthlyForecastDTO;
import com.example.moneymanager.repository.ExpenseRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ForecastServiceAiInsightRegressionTest {

    @Mock private ExpenseRepository expenseRepository;
    @Mock private ProfileService profileService;
    @Mock private GptOssService gptOssService;

    @InjectMocks
    private ForecastService forecastService;

    @Test
    @DisplayName("REGRESSION: forecast AI insight must use GptOssService directly")
    void analyzeForecastWithAi_routesDirectlyToGptOssService() {
        MonthlyForecastDTO forecast = MonthlyForecastDTO.builder()
                .year(2026)
                .month(6)
                .categories(List.of(
                        CategoryForecastItem.builder()
                                .categoryId(1L)
                                .categoryName("An uong")
                                .predictedAmount(new BigDecimal("2500000"))
                                .historicalAverage(new BigDecimal("2100000"))
                                .trend("UP")
                                .build()
                ))
                .build();

        when(gptOssService.callWithPrompt(
                anyString(),
                anyString(),
                eq(512)
        )).thenReturn("Forecast analysis");

        ForecastInsightDTO result = forecastService.analyzeForecastWithAi(forecast);

        assertNotNull(result);
        assertEquals("Forecast analysis", result.getNarrative());
        assertNotNull(result.getGeneratedAt());
        var gptOssPrompt = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(gptOssService).callWithPrompt(anyString(), gptOssPrompt.capture(), eq(512));
        assertTrue(gptOssPrompt.getValue().contains("6/2026"));
        assertTrue(gptOssPrompt.getValue().contains("An uong"));
    }
}

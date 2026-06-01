import http from "../../services/http";
import { API_ENDPOINTS } from "../../constants/api";

/**
 * Fetch basic AI insight summary for the current month.
 * Returns { insight: string, status: string } or an error object.
 */
export async function fetchAiInsight() {
  const response = await http.get(API_ENDPOINTS.AI_INSIGHT);
  return response.data;
}

/**
 * Fetch detailed AI insight with forecast, risk analysis, and recommendations.
 * This endpoint may be restricted to PREMIUM users by the backend.
 * Returns extended insight data or 403 if insufficient plan.
 */
export async function fetchDetailedAiInsight() {
  const response = await http.get(API_ENDPOINTS.AI_INSIGHT_DETAILED);
  return response.data;
}

/**
 * Fetch AI forecast insight for a specific month.
 * The user selects a month (current or future), the system uses historical data
 * to predict financial behavior for that month.
 *
 * @param {number} year - Year to forecast (e.g., 2026)
 * @param {number} month - Month to forecast (1-12)
 * @returns {Promise<Object>} Comprehensive forecast result:
 *   - totalPredictedExpense: total predicted spending
 *   - categories: array of category forecasts
 *   - topRiskCategory: category with highest risk
 *   - anomalyCount: number of anomalies detected
 *   - anomalies: array of anomaly items
 *   - narrative: AI-generated insight text
 *   - generatedAt: timestamp of generation
 */
export async function fetchAiForecast(year, month) {
  const response = await http.get(API_ENDPOINTS.AI_INSIGHT_FORECAST(year, month));
  return response.data;
}

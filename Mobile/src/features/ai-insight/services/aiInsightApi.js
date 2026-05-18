import http from "../../../services/http";
import { API_ENDPOINTS } from "../../../constants/api";

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

import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants/api";

/**
 * Send a chat message to Gemini AI (single-turn legacy fallback)
 * @param {string} message 
 * @returns {Promise<{reply: string, model: string}>}
 */
export const sendGeminiChat = async (message) => {
  const response = await apiClient.post(API_ENDPOINTS.GEMINI_CHAT, { message });
  return response.data;
};

/**
 * Send a multi-turn chat message to chosen provider (Gemini or GPT-OSS)
 * @param {Array<{role: string, content: string}>} messages 
 * @param {string} provider - "gemini" | "gptoss"
 * @param {string} model - optional model identifier
 * @returns {Promise<{reply: string, provider: string, modelUsed: string}>}
 */
export const sendAiChat = async (messages, provider = "gemini", model = null, sessionId = null, saveHistory = true, signal = null) => {
  const response = await apiClient.post(API_ENDPOINTS.AI_CHAT, {
    provider,
    model,
    messages,
    sessionId,
    saveHistory
  }, { signal });
  return response.data;
};

/**
 * Parse the user message to find their financial intent and extract fields.
 * @param {string} userMessage 
 * @param {string} pageContext 
 * @param {Array<{role: string, content: string}>} conversationHistory 
 * @param {string} provider 
 * @param {string} model 
 * @param {string} sessionId 
 * @param {any} signal 
 * @returns {Promise<any>}
 */
export const parseAiIntent = async (userMessage, pageContext = "dashboard", conversationHistory = [], provider = "gemini", model = null, sessionId = null, signal = null) => {
  const response = await apiClient.post(API_ENDPOINTS.AI_PARSE_INTENT, {
    provider,
    model,
    userMessage,
    pageContext,
    conversationHistory,
    sessionId
  }, { signal });
  return response.data;
};

/**
 * Execute the confirmed AI agent transaction.
 * @param {string} intent 
 * @param {object} extractedData 
 * @returns {Promise<{status: string, message: string, operationId: string, undoable: boolean}>}
 */
export const confirmAiAction = async (intent, extractedData) => {
  const response = await apiClient.post(API_ENDPOINTS.AI_CONFIRM_ACTION, {
    intent,
    extractedData
  });
  return response.data;
};

/**
 * Undo a previously executed transaction.
 * @param {string} operationId 
 * @returns {Promise<any>}
 */
export const undoAiAction = async (operationId) => {
  const response = await apiClient.post(API_ENDPOINTS.AI_UNDO(operationId));
  return response.data;
};

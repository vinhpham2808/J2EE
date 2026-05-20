import http from "./http";
import { API_ENDPOINTS } from "../constants/api";

/**
 * Send a chat message to Gemini AI (single-turn legacy fallback)
 * @param {string} message 
 * @returns {Promise<{reply: string, model: string}>}
 */
export const sendGeminiChat = async (message) => {
  const response = await http.post(API_ENDPOINTS.GEMINI_CHAT, { message });
  return response.data;
};

/**
 * Send a multi-turn chat message to chosen provider (Gemini or GPT-OSS)
 * @param {Array<{role: string, content: string}>} messages 
 * @param {string} provider - "gemini" | "gptoss"
 * @returns {Promise<{reply: string, provider: string, modelUsed: string}>}
 */
export const sendAiChat = async (messages, provider = "gemini") => {
  const response = await http.post(API_ENDPOINTS.AI_CHAT, {
    provider,
    messages
  });
  return response.data;
};

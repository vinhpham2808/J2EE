jest.mock("../apiClient", () => ({ post: jest.fn() }));

import { sendGeminiChat, sendAiChat, parseAiIntent, confirmAiAction, undoAiAction } from "../aiChatService";

describe("aiChatService", () => {
  const apiClient = require("../apiClient");

  beforeEach(() => { jest.clearAllMocks(); });

  describe("sendGeminiChat", () => {
    test("posts message and returns reply", async () => {
      apiClient.post.mockResolvedValueOnce({ data: { reply: "Hello!", model: "gemini" } });

      const result = await sendGeminiChat("Hi");
      expect(result).toEqual({ reply: "Hello!", model: "gemini" });
      expect(apiClient.post).toHaveBeenCalledWith("/gemini/chat", { message: "Hi" });
    });
  });

  describe("sendAiChat", () => {
    test("posts messages with provider and returns reply", async () => {
      const messages = [{ role: "user", content: "Hello" }];
      apiClient.post.mockResolvedValueOnce({ data: { reply: "Hi there", provider: "gemini" } });

      const result = await sendAiChat(messages, "gemini", null, null, true, null);
      expect(result).toEqual({ reply: "Hi there", provider: "gemini" });
      expect(apiClient.post).toHaveBeenCalledWith(
        "/ai/chat",
        { provider: "gemini", model: null, messages, sessionId: null, saveHistory: true },
        { signal: null }
      );
    });

    test("passes sessionId and signal when provided", async () => {
      const signal = new AbortController().signal;
      apiClient.post.mockResolvedValueOnce({ data: { reply: "OK" } });

      await sendAiChat([], "gptoss", "gpt-4", "session-123", false, signal);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/ai/chat",
        { provider: "gptoss", model: "gpt-4", messages: [], sessionId: "session-123", saveHistory: false },
        { signal }
      );
    });
  });

  describe("parseAiIntent", () => {
    test("posts intent parsing request", async () => {
      apiClient.post.mockResolvedValueOnce({ data: { intent: "add_expense" } });

      const result = await parseAiIntent("Add 100k for food", "expense", [], "gemini");
      expect(result).toEqual({ intent: "add_expense" });
      expect(apiClient.post).toHaveBeenCalledWith(
        "/ai/parse-intent",
        {
          provider: "gemini", model: null, userMessage: "Add 100k for food",
          pageContext: "expense", conversationHistory: [], sessionId: null,
        },
        { signal: null }
      );
    });
  });

  describe("confirmAiAction", () => {
    test("posts confirmed action and returns result", async () => {
      apiClient.post.mockResolvedValueOnce({ data: { status: "success", operationId: "op-1" } });

      const result = await confirmAiAction("add_expense", { amount: 100 });
      expect(result).toEqual({ status: "success", operationId: "op-1" });
      expect(apiClient.post).toHaveBeenCalledWith("/ai/confirm-action", { intent: "add_expense", extractedData: { amount: 100 } });
    });
  });

  describe("undoAiAction", () => {
    test("posts undo request with operationId", async () => {
      apiClient.post.mockResolvedValueOnce({ data: { status: "undone" } });

      const result = await undoAiAction("op-1");
      expect(result).toEqual({ status: "undone" });
      expect(apiClient.post).toHaveBeenCalledWith("/ai/undo/op-1");
    });
  });
});

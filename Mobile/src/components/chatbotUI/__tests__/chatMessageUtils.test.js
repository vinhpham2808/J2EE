import {
  getWelcomeMessage,
  mapStoredMessages,
  buildHistory,
  buildPersistedMessages,
  hasPendingIntent,
} from "../chatMessageUtils";

describe("chatMessageUtils", () => {
  const t = (key) => ({ "chatbot.welcome": "Xin chào! Tôi có thể giúp gì?" }[key] || key);

  describe("getWelcomeMessage", () => {
    test("returns welcome message with bot sender", () => {
      const msg = getWelcomeMessage(t);
      expect(msg.id).toBe("welcome");
      expect(msg.text).toBe("Xin chào! Tôi có thể giúp gì?");
      expect(msg.sender).toBe("bot");
      expect(msg.time).toBeDefined();
    });
  });

  describe("mapStoredMessages", () => {
    test("maps raw messages correctly", () => {
      const raw = [
        { id: 1, content: "Hello", role: "user", timestamp: "2026-06-19T10:00:00Z" },
        { id: 2, content: "Hi there", role: "assistant", timestamp: "2026-06-19T10:00:05Z" },
      ];
      const mapped = mapStoredMessages(raw, t);
      expect(mapped).toHaveLength(2);
      expect(mapped[0].sender).toBe("user");
      expect(mapped[1].sender).toBe("bot");
    });

    test("returns welcome message for empty array", () => {
      const mapped = mapStoredMessages([], t);
      expect(mapped).toHaveLength(1);
      expect(mapped[0].id).toBe("welcome");
    });

    test("handles undefined messages by using default parameter", () => {
      expect(mapStoredMessages(undefined, t)).toHaveLength(1);
      expect(mapStoredMessages(void 0, t)).toHaveLength(1);
    });

    test("assigns time from timestamp", () => {
      const raw = [{ id: 1, content: "Hi", role: "user", timestamp: "2026-06-19T10:30:00Z" }];
      const mapped = mapStoredMessages(raw, t);
      expect(mapped[0].time).toBeTruthy();
    });
  });

  describe("buildHistory", () => {
    test("filters out welcome, system, intent, confirmation messages", () => {
      const messages = [
        { id: "welcome", sender: "bot", text: "Hi" },
        { id: "1", isSystem: true, sender: "bot", text: "sys" },
        { id: "2", isIntent: true, sender: "bot", text: "intent" },
        { id: "3", isConfirmation: true, sender: "bot", text: "confirm" },
        { id: "4", sender: "user", text: "Hello" },
      ];
      const history = buildHistory(messages);
      expect(history).toHaveLength(1);
      expect(history[0].role).toBe("user");
      expect(history[0].content).toBe("Hello");
    });

    test("limits to last 20 messages", () => {
      const messages = Array.from({ length: 25 }, (_, i) => ({ id: String(i), sender: "user", text: `msg${i}` }));
      const history = buildHistory(messages);
      expect(history).toHaveLength(20);
      expect(history[0].content).toBe("msg5");
    });

    test("maps sender to role correctly", () => {
      const messages = [
        { id: "1", sender: "user", text: "Hello" },
        { id: "2", sender: "bot", text: "Hi" },
      ];
      const history = buildHistory(messages);
      expect(history[0].role).toBe("user");
      expect(history[1].role).toBe("assistant");
    });
  });

  describe("buildPersistedMessages", () => {
    test("filters out welcome, system, intent, confirmation, and error messages", () => {
      const messages = [
        { id: "welcome", sender: "bot", text: "Hi" },
        { id: "1", sender: "user", text: "Hello" },
        { id: "2", isError: true, sender: "bot", text: "Error" },
      ];
      const persisted = buildPersistedMessages(messages);
      expect(persisted).toHaveLength(1);
      expect(persisted[0].content).toBe("Hello");
    });
  });

  describe("hasPendingIntent", () => {
    test("returns true when a message has isIntent without isConfirmation", () => {
      const messages = [
        { id: "1", text: "Hi", sender: "user" },
        { id: "2", text: "Action", sender: "bot", isIntent: true },
      ];
      expect(hasPendingIntent(messages)).toBe(true);
    });

    test("returns false when intent is confirmed", () => {
      const messages = [
        { id: "1", text: "Action", sender: "bot", isIntent: true, isConfirmation: true },
      ];
      expect(hasPendingIntent(messages)).toBe(false);
    });

    test("returns false when no intents", () => {
      expect(hasPendingIntent([])).toBe(false);
    });
  });
});

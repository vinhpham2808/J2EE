export const getCurrentTimeLabel = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const WELCOME_MESSAGE = {
  id: "welcome",
  text: "Xin chào! Tôi là Nova Money - Trợ lý AI của Money Manager. Tôi có thể trò chuyện, tư vấn tài chính, hoặc tự động thao tác dữ liệu giúp bạn ở chế độ Agent.",
  sender: "bot",
  time: getCurrentTimeLabel()
};

export function mapStoredMessages(rawMessages = []) {
  const mapped = rawMessages.map((message) => ({
    id: String(message.id || Math.random()),
    text: message.content || "",
    sender: message.role === "user" ? "user" : "bot",
    time: message.timestamp
      ? new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : getCurrentTimeLabel()
  }));

  return mapped.length > 0 ? mapped : [WELCOME_MESSAGE];
}

function isHistoryMessage(message) {
  return (
    message.id !== "welcome" &&
    !message.isSystem &&
    !message.isIntent &&
    !message.isConfirmation
  );
}

function isPersistableMessage(message) {
  return (
    isHistoryMessage(message) &&
    !message.isError
  );
}

export function buildHistory(messages) {
  return messages
    .filter((message) => isHistoryMessage(message))
    .slice(-20)
    .map((message) => ({
      role: message.sender === "user" ? "user" : "assistant",
      content: message.text
    }));
}

export function buildPersistedMessages(messages) {
  return messages
    .filter((message) => isPersistableMessage(message))
    .map((message) => ({
      role: message.sender === "user" ? "user" : "assistant",
      content: message.text
    }));
}

export function hasPendingIntent(messages) {
  return messages.some((message) => message.isIntent && !message.isConfirmation);
}

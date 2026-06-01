package com.example.moneymanager.service;

import com.example.moneymanager.dto.AIChatMessageDTO;
import com.example.moneymanager.dto.ChatSessionDTO;
import com.example.moneymanager.exception.ForbiddenException;
import com.example.moneymanager.model.ChatMessage;
import com.example.moneymanager.model.ChatSession;
import com.example.moneymanager.repository.ChatMessageRepository;
import com.example.moneymanager.repository.ChatSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatHistoryService {

    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;

    public List<ChatSessionDTO> getSessionsByUserId(Long userId) {
        List<ChatSession> sessions = sessionRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        return sessions.stream().map(s -> ChatSessionDTO.builder()
                .id(s.getId())
                .title(s.getTitle())
                .createdAt(s.getCreatedAt() != null ? s.getCreatedAt().toString() : null)
                .updatedAt(s.getUpdatedAt() != null ? s.getUpdatedAt().toString() : null)
                .build()
        ).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getMessagesBySessionId(String sessionId, Long currentUserId) {
        ChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));
        if (!session.getUserId().equals(currentUserId)) {
            throw new ForbiddenException("Access denied to session: " + sessionId);
        }
        List<ChatMessage> messages = messageRepository.findBySessionIdOrderByTimestampAsc(sessionId);
        return messages.stream().map(m -> {
            Map<String, Object> msg = new java.util.HashMap<>();
            msg.put("id", m.getId());
            msg.put("role", m.getRole());
            msg.put("content", m.getContent());
            msg.put("timestamp", m.getTimestamp().toString());
            return msg;
        }).collect(Collectors.toList());
    }

    public ChatSession createSession(Long userId, String title) {
        ChatSession session = ChatSession.builder()
                .userId(userId)
                .title(title)
                .build();
        return sessionRepository.save(session);
    }

    public ChatMessage addMessage(String sessionId, String role, String content) {
        ChatMessage message = ChatMessage.builder()
                .sessionId(sessionId)
                .role(role)
                .content(content)
                .build();
        ChatMessage saved = messageRepository.save(message);

        sessionRepository.findById(sessionId).ifPresent(session -> {
            session.setUpdatedAt(Instant.now());
            sessionRepository.save(session);
        });

        return saved;
    }

    public void replaceSessionMessages(String sessionId, Long currentUserId, List<AIChatMessageDTO> messages) {
        ChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));
        if (!session.getUserId().equals(currentUserId)) {
            throw new ForbiddenException("Access denied to session: " + sessionId);
        }

        List<AIChatMessageDTO> sanitizedMessages = messages == null ? List.of() : messages.stream()
                .filter(message -> message != null
                        && ("user".equals(message.getRole()) || "assistant".equals(message.getRole()))
                        && message.getContent() != null
                        && !message.getContent().isBlank())
                .toList();

        if (sanitizedMessages.isEmpty()) {
            throw new IllegalArgumentException("Danh sach tin nhan khong hop le.");
        }

        messageRepository.deleteBySessionId(sessionId);
        messageRepository.saveAll(sanitizedMessages.stream()
                .map(message -> ChatMessage.builder()
                        .sessionId(sessionId)
                        .role(message.getRole())
                        .content(message.getContent())
                        .build())
                .toList());

        session.setTitle(buildSessionTitle(sanitizedMessages, session.getTitle()));
        session.setUpdatedAt(Instant.now());
        sessionRepository.save(session);
    }

    private String buildSessionTitle(List<AIChatMessageDTO> messages, String fallbackTitle) {
        return messages.stream()
                .filter(message -> "user".equals(message.getRole()))
                .map(AIChatMessageDTO::getContent)
                .filter(content -> content != null && !content.isBlank())
                .findFirst()
                .map(content -> content.length() > 50 ? content.substring(0, 50) + "..." : content)
                .orElse(fallbackTitle);
    }

    public void renameSession(String sessionId, String newTitle, Long currentUserId) {
        ChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));
        if (!session.getUserId().equals(currentUserId)) {
            throw new ForbiddenException("Access denied to session: " + sessionId);
        }
        session.setTitle(newTitle);
        session.setUpdatedAt(Instant.now());
        sessionRepository.save(session);
    }

    @Transactional
    public void deleteSession(String sessionId, Long currentUserId) {
        ChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));
        if (!session.getUserId().equals(currentUserId)) {
            throw new ForbiddenException("Access denied to session: " + sessionId);
        }
        sessionRepository.deleteById(sessionId);
        messageRepository.deleteBySessionId(sessionId);
    }
}

package com.example.moneymanager.repository;

import com.example.moneymanager.model.ChatSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Repository
@RequiredArgsConstructor
public class ChatSessionRepository {

    private final DynamoDbClient dynamoDbClient;
    private static final String TABLE_NAME = "chat_sessions";

    public Optional<ChatSession> findById(String id) {
        if (id == null) return Optional.empty();
        
        Map<String, AttributeValue> key = Map.of("id", AttributeValue.builder().s(id).build());
        GetItemRequest request = GetItemRequest.builder()
                .tableName(TABLE_NAME)
                .key(key)
                .build();
        
        try {
            GetItemResponse response = dynamoDbClient.getItem(request);
            if (!response.hasItem()) {
                return Optional.empty();
            }
            return Optional.of(mapToSession(response.item()));
        } catch (Exception e) {
            log.error("Failed to find session by id [{}]: {}", id, e.getMessage(), e);
            return Optional.empty();
        }
    }

    public List<ChatSession> findByUserIdOrderByUpdatedAtDesc(Long userId) {
        if (userId == null) return List.of();

        Map<String, AttributeValue> expressionAttributeValues = Map.of(
                ":userId", AttributeValue.builder().n(String.valueOf(userId)).build()
        );
        ScanRequest request = ScanRequest.builder()
                .tableName(TABLE_NAME)
                .filterExpression("userId = :userId")
                .expressionAttributeValues(expressionAttributeValues)
                .build();

        try {
            ScanResponse response = dynamoDbClient.scan(request);
            List<ChatSession> sessions = response.items().stream()
                    .map(this::mapToSession)
                    .collect(Collectors.toList());
            
            sessions.sort((s1, s2) -> s2.getUpdatedAt().compareTo(s1.getUpdatedAt()));
            return sessions;
        } catch (Exception e) {
            log.error("Failed to find sessions for userId [{}]: {}", userId, e.getMessage(), e);
            return List.of();
        }
    }

    public ChatSession save(ChatSession session) {
        if (session == null) return null;

        if (session.getId() == null) {
            session.setId(UUID.randomUUID().toString());
        }
        if (session.getCreatedAt() == null) {
            session.setCreatedAt(Instant.now());
        }
        if (session.getUpdatedAt() == null) {
            session.setUpdatedAt(Instant.now());
        }

        Map<String, AttributeValue> item = new HashMap<>();
        item.put("id", AttributeValue.builder().s(session.getId()).build());
        item.put("userId", AttributeValue.builder().n(String.valueOf(session.getUserId())).build());
        if (session.getTitle() != null) {
            item.put("title", AttributeValue.builder().s(session.getTitle()).build());
        }
        item.put("createdAt", AttributeValue.builder().s(session.getCreatedAt().toString()).build());
        item.put("updatedAt", AttributeValue.builder().s(session.getUpdatedAt().toString()).build());

        PutItemRequest request = PutItemRequest.builder()
                .tableName(TABLE_NAME)
                .item(item)
                .build();

        try {
            dynamoDbClient.putItem(request);
            return session;
        } catch (Exception e) {
            log.error("Failed to save session [{}]: {}", session.getId(), e.getMessage(), e);
            throw new RuntimeException("Lỗi lưu session vào DynamoDB: " + e.getMessage(), e);
        }
    }

    public void deleteById(String id) {
        if (id == null) return;

        Map<String, AttributeValue> key = Map.of("id", AttributeValue.builder().s(id).build());
        DeleteItemRequest request = DeleteItemRequest.builder()
                .tableName(TABLE_NAME)
                .key(key)
                .build();

        try {
            dynamoDbClient.deleteItem(request);
        } catch (Exception e) {
            log.error("Failed to delete session [{}]: {}", id, e.getMessage(), e);
            throw new RuntimeException("Lỗi xóa session khỏi DynamoDB: " + e.getMessage(), e);
        }
    }

    private ChatSession mapToSession(Map<String, AttributeValue> item) {
        return ChatSession.builder()
                .id(item.get("id").s())
                .userId(item.containsKey("userId") ? Long.valueOf(item.get("userId").n()) : null)
                .title(item.containsKey("title") ? item.get("title").s() : null)
                .createdAt(item.containsKey("createdAt") ? Instant.parse(item.get("createdAt").s()) : Instant.now())
                .updatedAt(item.containsKey("updatedAt") ? Instant.parse(item.get("updatedAt").s()) : Instant.now())
                .build();
    }
}

package com.example.moneymanager.repository;

import com.example.moneymanager.model.ChatMessage;
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
public class ChatMessageRepository {

    private final DynamoDbClient dynamoDbClient;
    private static final String TABLE_NAME = "chat_messages";

    public List<ChatMessage> findBySessionIdOrderByTimestampAsc(String sessionId) {
        if (sessionId == null) return List.of();

        Map<String, AttributeValue> expressionAttributeValues = Map.of(
                ":sessionId", AttributeValue.builder().s(sessionId).build()
        );
        ScanRequest request = ScanRequest.builder()
                .tableName(TABLE_NAME)
                .filterExpression("sessionId = :sessionId")
                .expressionAttributeValues(expressionAttributeValues)
                .build();

        try {
            ScanResponse response = dynamoDbClient.scan(request);
            List<ChatMessage> messages = response.items().stream()
                    .map(this::mapToMessage)
                    .collect(Collectors.toList());
            
            messages.sort(Comparator.comparing(ChatMessage::getTimestamp));
            return messages;
        } catch (Exception e) {
            log.error("Failed to find messages for sessionId [{}]: {}", sessionId, e.getMessage(), e);
            return List.of();
        }
    }

    public ChatMessage save(ChatMessage message) {
        if (message == null) return null;

        if (message.getId() == null) {
            message.setId(UUID.randomUUID().toString());
        }
        if (message.getTimestamp() == null) {
            message.setTimestamp(Instant.now());
        }

        Map<String, AttributeValue> item = new HashMap<>();
        item.put("id", AttributeValue.builder().s(message.getId()).build());
        item.put("sessionId", AttributeValue.builder().s(message.getSessionId()).build());
        if (message.getRole() != null) {
            item.put("role", AttributeValue.builder().s(message.getRole()).build());
        }
        if (message.getContent() != null) {
            item.put("content", AttributeValue.builder().s(message.getContent()).build());
        }
        item.put("timestamp", AttributeValue.builder().s(message.getTimestamp().toString()).build());

        PutItemRequest request = PutItemRequest.builder()
                .tableName(TABLE_NAME)
                .item(item)
                .build();

        try {
            dynamoDbClient.putItem(request);
            return message;
        } catch (Exception e) {
            log.error("Failed to save message [{}]: {}", message.getId(), e.getMessage(), e);
            throw new RuntimeException("Lỗi lưu message vào DynamoDB: " + e.getMessage(), e);
        }
    }

    public void saveAll(List<ChatMessage> messages) {
        if (messages == null || messages.isEmpty()) return;
        for (ChatMessage message : messages) {
            save(message);
        }
    }

    public void deleteBySessionId(String sessionId) {
        if (sessionId == null) return;

        List<ChatMessage> messages = findBySessionIdOrderByTimestampAsc(sessionId);
        if (messages.isEmpty()) return;

        try {
            for (ChatMessage msg : messages) {
                Map<String, AttributeValue> key = Map.of("id", AttributeValue.builder().s(msg.getId()).build());
                DeleteItemRequest request = DeleteItemRequest.builder()
                        .tableName(TABLE_NAME)
                        .key(key)
                        .build();
                dynamoDbClient.deleteItem(request);
            }
            log.info("Deleted all messages for sessionId: {}", sessionId);
        } catch (Exception e) {
            log.error("Failed to delete messages for sessionId [{}]: {}", sessionId, e.getMessage(), e);
            throw new RuntimeException("Lỗi xóa messages khỏi DynamoDB: " + e.getMessage(), e);
        }
    }

    private ChatMessage mapToMessage(Map<String, AttributeValue> item) {
        return ChatMessage.builder()
                .id(item.get("id").s())
                .sessionId(item.containsKey("sessionId") ? item.get("sessionId").s() : null)
                .role(item.containsKey("role") ? item.get("role").s() : null)
                .content(item.containsKey("content") ? item.get("content").s() : null)
                .timestamp(item.containsKey("timestamp") ? Instant.parse(item.get("timestamp").s()) : Instant.now())
                .build();
    }
}

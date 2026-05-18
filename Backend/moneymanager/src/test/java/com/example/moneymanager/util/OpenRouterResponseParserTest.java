package com.example.moneymanager.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OpenRouterResponseParserTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void extractAssistantText_readsStringContent() throws Exception {
        JsonNode root = objectMapper.readTree("""
                {
                  "choices": [
                    {
                      "message": {
                        "content": "Xin chao Quy"
                      }
                    }
                  ]
                }
                """);

        assertThat(OpenRouterResponseParser.extractAssistantText(root)).isEqualTo("Xin chao Quy");
    }

    @Test
    void extractAssistantText_readsArrayContentParts() throws Exception {
        JsonNode root = objectMapper.readTree("""
                {
                  "choices": [
                    {
                      "message": {
                        "content": [
                          { "type": "text", "text": "Dong 1" },
                          { "type": "text", "text": "Dong 2" }
                        ]
                      }
                    }
                  ]
                }
                """);

        assertThat(OpenRouterResponseParser.extractAssistantText(root)).isEqualTo("Dong 1\nDong 2");
    }

    @Test
    void extractAssistantText_readsChoiceTextFallback() throws Exception {
        JsonNode root = objectMapper.readTree("""
                {
                  "choices": [
                    {
                      "text": "Fallback text"
                    }
                  ]
                }
                """);

        assertThat(OpenRouterResponseParser.extractAssistantText(root)).isEqualTo("Fallback text");
    }
}

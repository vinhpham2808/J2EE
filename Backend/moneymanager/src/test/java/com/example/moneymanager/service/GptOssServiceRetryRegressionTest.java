package com.example.moneymanager.service;

import com.example.moneymanager.config.GptOssKeyRotator;
import com.example.moneymanager.config.GptOssProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClient;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GptOssServiceRetryRegressionTest {

    @Mock private RestClient gptOssRestClient;
    @Mock private RestClient.RequestBodyUriSpec requestBodyUriSpec;
    @Mock private RestClient.RequestBodySpec requestBodySpec;
    @Mock private RestClient.ResponseSpec responseSpec;

    @Test
    @DisplayName("REGRESSION: GPT-OSS prompt call retries transient empty response and succeeds on a later attempt")
    void callWithPrompt_retriesWhenFirstResponseIsEmpty() {
        GptOssProperties properties = new GptOssProperties(
                List.of("key-1", "key-2"),
                "openai/gpt-oss-120b:free",
                "https://openrouter.ai/api/v1",
                60
        );
        GptOssService service = new GptOssService(
                gptOssRestClient,
                properties,
                new GptOssKeyRotator(properties),
                new ObjectMapper()
        );

        when(gptOssRestClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri("/chat/completions")).thenReturn(requestBodySpec);
        when(requestBodySpec.header(anyString(), anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.body(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.onStatus(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any())).thenReturn(responseSpec);
        when(responseSpec.body(String.class))
                .thenReturn("")
                .thenReturn("""
                        {
                          "choices": [
                            {
                              "message": {
                                "content": "Phân tích ổn định"
                              }
                            }
                          ]
                        }
                        """);

        String reply = service.callWithPrompt("System prompt", "User prompt", 300);

        assertEquals("Phân tích ổn định", reply);
        verify(gptOssRestClient, times(2)).post();
    }
}

package com.example.moneymanager.service;

import com.example.moneymanager.dto.AIChatMessageDTO;
import com.example.moneymanager.exception.ForbiddenException;
import com.example.moneymanager.model.ChatMessage;
import com.example.moneymanager.model.ChatSession;
import com.example.moneymanager.repository.ChatMessageRepository;
import com.example.moneymanager.repository.ChatSessionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatHistoryServiceReplaceMessagesRegressionTest {

    @Mock private ChatSessionRepository sessionRepository;
    @Mock private ChatMessageRepository messageRepository;

    @InjectMocks private ChatHistoryService chatHistoryService;

    @Test
    @DisplayName("REGRESSION: replacing session messages must overwrite history and refresh title from first user message")
    void replaceSessionMessages_overwritesHistoryAndTitle() {
        ChatSession session = ChatSession.builder()
                .id("507f1f77bcf86cd799439011")
                .userId(7L)
                .title("Tieu de cu")
                .build();
        when(sessionRepository.findById("507f1f77bcf86cd799439011")).thenReturn(Optional.of(session));

        chatHistoryService.replaceSessionMessages(
                "507f1f77bcf86cd799439011",
                7L,
                List.of(
                        AIChatMessageDTO.builder().role("user").content("Sua lai phan tich chi tieu thang nay cho toi").build(),
                        AIChatMessageDTO.builder().role("assistant").content("Day la cau tra loi moi").build()
                )
        );

        verify(messageRepository).deleteBySessionId("507f1f77bcf86cd799439011");

        ArgumentCaptor<List<ChatMessage>> savedMessagesCaptor = ArgumentCaptor.forClass(List.class);
        verify(messageRepository).saveAll(savedMessagesCaptor.capture());
        assertEquals(2, savedMessagesCaptor.getValue().size());
        assertEquals("user", savedMessagesCaptor.getValue().get(0).getRole());
        assertEquals("Sua lai phan tich chi tieu thang nay cho toi", savedMessagesCaptor.getValue().get(0).getContent());
        assertEquals("assistant", savedMessagesCaptor.getValue().get(1).getRole());

        ArgumentCaptor<ChatSession> savedSessionCaptor = ArgumentCaptor.forClass(ChatSession.class);
        verify(sessionRepository).save(savedSessionCaptor.capture());
        assertEquals("Sua lai phan tich chi tieu thang nay cho toi", savedSessionCaptor.getValue().getTitle());
    }

    @Test
    @DisplayName("REGRESSION: replacing session messages must reject another user's session")
    void replaceSessionMessages_rejectsForeignSession() {
        ChatSession session = ChatSession.builder()
                .id("507f1f77bcf86cd799439011")
                .userId(9L)
                .title("Tieu de cu")
                .build();
        when(sessionRepository.findById("507f1f77bcf86cd799439011")).thenReturn(Optional.of(session));

        assertThrows(ForbiddenException.class, () -> chatHistoryService.replaceSessionMessages(
                "507f1f77bcf86cd799439011",
                7L,
                List.of(AIChatMessageDTO.builder().role("user").content("Hello").build())
        ));
    }
}

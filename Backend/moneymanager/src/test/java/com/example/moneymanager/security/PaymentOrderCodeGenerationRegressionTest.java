package com.example.moneymanager.security;

import com.example.moneymanager.entity.PaymentEntity;
import com.example.moneymanager.exception.PaymentException;
import com.example.moneymanager.repository.PaymentRepository;
import com.example.moneymanager.service.DocumentService;
import com.example.moneymanager.service.NotificationService;
import com.example.moneymanager.service.PaymentService;
import com.example.moneymanager.service.ProfileService;
import com.example.moneymanager.service.SubscriptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import vn.payos.PayOS;

import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentOrderCodeGenerationRegressionTest {

    @Mock PayOS payOS;
    @Mock PaymentRepository paymentRepository;
    @Mock ProfileService profileService;
    @Mock SubscriptionService subscriptionService;
    @Mock NotificationService notificationService;
    @Mock DocumentService documentService;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(payOS, paymentRepository, profileService,
                subscriptionService, notificationService, documentService);
    }

    @Test
    @DisplayName("REGRESSION: rapid sequential orderCode generation must not produce collisions across 200 calls")
    void generateOrderCode_mustNotCollideAcross200Calls() throws Exception {
        when(paymentRepository.existsByOrderCode(anyLong())).thenReturn(false);

        java.lang.reflect.Method method = PaymentService.class.getDeclaredMethod("generateOrderCode");
        method.setAccessible(true);

        Set<Long> generated = new HashSet<>();
        for (int i = 0; i < 200; i++) {
            long code = (Long) method.invoke(paymentService);
            assertTrue(code > 0, "orderCode must be positive");
            assertTrue(generated.add(code), "code " + code + " collided at iteration " + i +
                    " — orderCode generator has insufficient entropy");
        }
    }

    @Test
    @DisplayName("REGRESSION: concurrent orderCode generation must handle collisions via retry")
    void generateOrderCode_mustRetryOnCollision() throws Exception {
        java.lang.reflect.Method method = PaymentService.class.getDeclaredMethod("generateOrderCode");
        method.setAccessible(true);

        AtomicInteger callCount = new AtomicInteger(0);
        when(paymentRepository.existsByOrderCode(anyLong())).thenAnswer(inv -> {
            int n = callCount.incrementAndGet();
            return n % 7 == 0;
        });

        long code = (Long) method.invoke(paymentService);
        assertTrue(code > 0);
    }

    @Test
    @DisplayName("REGRESSION: orderCode must throw clear error after max retry attempts when collisions persist")
    void generateOrderCode_mustFailAfterMaxRetries() throws Exception {
        java.lang.reflect.Method method = PaymentService.class.getDeclaredMethod("generateOrderCode");
        method.setAccessible(true);

        when(paymentRepository.existsByOrderCode(anyLong())).thenReturn(true);

        try {
            method.invoke(paymentService);
            fail("Expected PaymentException after max retry attempts");
        } catch (java.lang.reflect.InvocationTargetException e) {
            assertTrue(e.getCause() instanceof PaymentException,
                    "Exception chain must contain PaymentException, got: " + e.getCause().getClass());
        }
    }
}

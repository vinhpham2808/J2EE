package com.example.moneymanager.exception;

public class AiRateLimitException extends RuntimeException {
    public AiRateLimitException(String message) {
        super(message);
    }
}

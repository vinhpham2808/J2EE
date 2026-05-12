package com.example.moneymanager.exception;

public class OtpCooldownException extends RuntimeException {

    private final long retryAfterSeconds;

    public OtpCooldownException(long retryAfterSeconds) {
        super("Vui lòng chờ " + retryAfterSeconds + " giây trước khi gửi lại mã OTP.");
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}

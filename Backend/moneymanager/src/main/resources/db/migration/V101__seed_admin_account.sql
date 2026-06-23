-- ============================================================
-- V101: Seed Admin Account
-- ⚠️ BẮT BUỘC đổi mật khẩu sau khi đăng nhập lần đầu!
-- Safe to run multiple times (INSERT IGNORE)
-- ============================================================

-- Bước 1: Đảm bảo role admin đã tồn tại (phòng trường hợp Flyway chạy trước RoleInitializer)
INSERT IGNORE INTO tbl_roles (id, name) VALUES (1, 'admin');
INSERT IGNORE INTO tbl_roles (id, name) VALUES (2, 'user');

-- Bước 2: Tạo tài khoản Admin mặc định
INSERT IGNORE INTO tbl_profiles (
    full_name,
    email,
    password,
    is_active,
    subscription_plan,
    subscription_status,
    auto_renew,
    ai_violation_score,
    role_id,
    created_at,
    updated_at
) VALUES (
    'System Admin',
    'admin@botdevgroup.me',
    '$2a$10$G5m73KQ1gvV.ncfOcYmF2OFic/HIoE50piOVt8n1RqdeUEy.zlc2y',  -- Admin@123456 (BCrypt cost=10, verified)
    TRUE,          -- is_active: kích hoạt ngay, không cần OTP
    'FREE',        -- subscription_plan
    'INACTIVE',    -- subscription_status
    FALSE,         -- auto_renew
    0,             -- ai_violation_score
    1,             -- role_id = 1 (admin)
    NOW(),
    NOW()
);

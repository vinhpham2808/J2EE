# Money Manager

Ứng dụng quản lý tài chính cá nhân đa nền tảng (Web + Mobile), hỗ trợ theo dõi thu chi, lập ngân sách, mục tiêu tiết kiệm, dự báo tài chính và trợ lý AI.

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Backend | Spring Boot, Java 21, Maven, MySQL, Redis |
| Frontend | React 19, Vite, Tailwind CSS 4, Recharts |
| Mobile | React Native (Expo), React Navigation, AsyncStorage |

---

## Subscription Plans

Hệ thống hỗ trợ 3 gói đăng ký: `FREE`, `BASIC`, `PREMIUM`. Các tính năng AI (Nova Agent, AI Coach) chỉ khả dụng trên gói **PREMIUM**.

### Plan Rules

| Tính năng | FREE | BASIC | PREMIUM |
|---|---|---|---|
| Danh mục | 10 | 30 | Không giới hạn |
| Giao dịch / tháng | 100 | 1.000 | Không giới hạn |
| Lọc lịch sử | 3 tháng | 12 tháng | Không giới hạn |
| Xuất Excel | ❌ | ✅ | ✅ |
| Gửi báo cáo qua Email | ❌ | ✅ | ✅ |
| Nova Agent (Agent mode) | ❌ | ❌ | ✅ |
| Nova Agent (Chat mode) | ❌ | ❌ | ✅ |
| Nhập hóa đơn (AI) | ❌ | ❌ | ✅ |
| AI Coach chi tiết | ❌ | ❌ | ✅ |
| Dự báo tài chính | ❌ | ❌ | ✅ |

### Backend Enforcement

Backend áp dụng giới hạn gói đăng ký tại các điểm:
- Tạo danh mục
- Tạo thu nhập / chi tiêu
- Lọc giao dịch
- Tải báo cáo Excel
- Gửi báo cáo qua Email
- Nhập hóa đơn
- AI Coach
- Dự báo tài chính

### Subscription Activation

- Người dùng mới bắt đầu với gói `FREE`
- Khi thanh toán PayOS được xác nhận `PAID`, backend tự động kích hoạt gói đã mua
- Gói hỗ trợ: `basic` → `BASIC`, `premium` → `PREMIUM`
- Mỗi profile lưu: `subscriptionPlan`, `subscriptionStatus`, `subscriptionActivatedAt`, `subscriptionExpiresAt`, `autoRenew`

---

## Features

### 🤖 Nova Agent AI

Trợ lý AI tích hợp trực tiếp trong ứng dụng, hỗ trợ 2 chế độ hoạt động với đa dạng model AI:

#### Hạ tầng AI

| Provider | Model | Cơ chế |
|---|---|---|
| Gemini (Google) | Gemini 2.5 Flash | API key rotation qua Redis |
| Gemini (Google) | Gemini 3.1 Flash Lite | API key rotation qua Redis |
| GPT-OSS (OpenRouter) | GPT-OSS 120B | API key rotation qua Redis |

Cơ chế **key rotation**: Redis lưu trữ quota và trạng thái từng API key. Khi một key hết quota hoặc lỗi, hệ thống tự động chuyển sang key tiếp theo trong pool. Hỗ trợ cooldown và tự động khôi phục key khi hết thời gian chờ.

#### Chế độ Agent (Gemini 2.5 Flash / Gemini 3.1 Flash Lite)
Tự động phân tích intent và thực hiện các tác vụ CRUD, xuất báo cáo:

| Nhóm | Thao tác |
|---|---|
| Chi tiêu | Tạo, Sửa, Xóa |
| Thu nhập | Tạo, Sửa, Xóa |
| Danh mục | Tạo, Sửa, Xóa |
| Ngân sách | Tạo, Sửa, Xóa |
| Mục tiêu tiết kiệm | Tạo, Sửa, Xóa |
| Xuất báo cáo | Xuất Excel chi tiêu / thu nhập |
| Gửi email | Gửi báo cáo chi tiêu / thu nhập qua email |

Cơ chế: Intent Parsing → Xác nhận từ người dùng → Thực thi → Hoàn tác (undo) trong vài phút.

Giao diện Nova Agent được thiết kế lại với:
- **Model selector**: Chọn giữa Gemini 2.5 Flash và Gemini 3.1 Flash Lite với icon và mô tả riêng
- **Loading skeleton**: Hoạt ảnh khi AI đang xử lý, tránh hiển thị đột ngột
- **Status indicator**: Dot xanh (sẵn sàng) / dot vàng nhấp nháy (đang xử lý)
- **AI Dashboard Banner**: Thiết kế 2 tầng rõ ràng — header gradient tím + body card trắng/sáng

#### Chế độ Chat (GPT-OSS 120B)
Hỏi đáp thông thường, không thực hiện thao tác dữ liệu:
- Tư vấn tài chính cá nhân
- Phân tích tâm lý chi tiêu
- Hỗ trợ cảm xúc về tiền bạc
- Lập kế hoạch mục tiêu dài hạn

#### Smart Spending Tips (AI Coach)

Phân tích chi tiêu 3 tháng gần nhất, đưa ra gợi ý tiết kiệm cá nhân hóa bằng tiếng Việt. **PREMIUM-only**.

### 🛡️ Spam Protection

Hệ thống chống spam 2 lớp:
- **Redis-based**: Đếm số lần gửi email theo tài khoản. Trên 5 lần/phút → khóa 10 phút, trên 10 lần → khóa 5 giờ
- **Rate Limiter (in-memory)**: Giới hạn theo IP cho từng endpoint (login: 5/phút, quên mật khẩu: 5/phút, gửi lại OTP: 3/phút, chat AI: 15/phút...). Trả về HTTP 429 khi vượt ngưỡng

### 📊 Email Reports

Gửi báo cáo Excel qua email dưới dạng file đính kèm, sử dụng Spring Mail (Brevo/Sendinblue SMTP). Hỗ trợ thẻ báo cáo hàng tháng (Monthly Report Card) đánh giá điểm chi tiêu A-F, phân tích danh mục và tiến độ tiết kiệm.

### 📥 Excel Export

Xuất báo cáo thu/chi dạng XLSX với Apache POI. Định dạng tiếng Việt, bảng mã màu (xanh = thu nhập, đỏ = chi tiêu), màu xen kẽ dòng, dòng tổng kèm định dạng VNĐ.

### 🔐 OTP

Mã OTP 6 chữ số (BCrypt hash) dùng cho kích hoạt tài khoản và đặt lại mật khẩu. Hiệu lực 210 giây, cooldown gửi lại 180 giây, tối đa 5 lần nhập sai, so sánh constant-time.

### 💰 Payment (PayOS)

Tích hợp cổng thanh toán PayOS: tạo link thanh toán, webhook xác nhận, đồng bộ trạng thái tự động mỗi 30 giây, tự động kích hoạt gói khi thanh toán thành công.

### 🧾 Receipt Import (Gemini Vision)

Tải ảnh hóa đơn → Gemini Vision trích xuất nơi bán, mặt hàng, số tiền → tự động tạo chi tiêu. **PREMIUM-only**. Hỗ trợ ảnh ≤10MB.

### 📈 Financial Forecasting

Dự báo chi tiêu tháng tới dựa trên 6 tháng lịch sử, phát hiện bất thường (2+ độ lệch chuẩn), phân tích xu hướng danh mục. **PREMIUM-only**.

### 🎯 Budget Management

Đặt hạn mức chi tiêu hàng tháng theo từng danh mục, theo dõi % đã sử dụng, cảnh báo khi vượt ngân sách.

### 💎 Saving Goals

Theo dõi mục tiêu tiết kiệm với đóng góp định kỳ. Tự động tính mục tiêu hàng tháng, quản lý trạng thái (ACTIVE/COMPLETED/CANCELLED).

### 🔔 Notifications

Thông báo in-app + email notification với tùy chọn bật/tắt theo loại. Hỗ trợ cảnh báo ngân sách, nhắc nhở mục tiêu tiết kiệm, thông báo thanh toán thành công.

### 🔑 Google OAuth2

Đăng nhập bằng Google. Xác thực Google ID Token, tự động tạo profile cho người dùng mới, cấp JWT.

### 🛠️ Admin Panel

Dashboard quản trị với thống kê tổng quan, quản lý người dùng (CRUD), theo dõi thanh toán, broadcast notification, quản lý subscription. Phân quyền theo role `ADMIN`.

### 📱 Mobile App

Ứng dụng React Native (Expo) đa nền tảng. Bottom tab navigation (Dashboard + Expenses), JWT auth + AsyncStorage, pull-to-refresh.

---

## Additional

| Tính năng | Chi tiết |
|---|---|
| JWT Auth | Spring Security + JWT filter, axios interceptor tự động refresh |
| Dark Mode | ThemeContext + Tailwind CSS dark mode toàn ứng dụng |
| File Upload | AWS S3 upload ảnh đại diện, xác thực magic bytes (JPEG/PNG/GIF/WebP) |
| Document Generation | AWS Lambda sinh PDF hóa đơn sau thanh toán |
| Dashboard Widgets | Widget tùy chỉnh kéo-thả, báo cáo tháng với xếp hạng A-F |
| Quick Expense | Mẫu chi tiêu nhanh, emoji picker cho danh mục |

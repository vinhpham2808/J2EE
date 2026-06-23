# =============================================================
# HƯỚNG DẪN TÁCH API VÀ WORKER — moneymanager backend
# =============================================================

## Kiến trúc

Backend được tách thành **2 container riêng biệt** từ **1 JAR duy nhất**:

| Container | Spring Profile | Mục đích |
|-----------|---------------|---------|
| `api`     | `api`         | REST API, Security, JWT, AI features |
| `worker`  | `worker`      | Scheduled jobs, Async handlers, DB Seeders |

---

## Cấu trúc file mới

```
/
├── Dockerfile.api          # Build image cho api container
├── Dockerfile.worker       # Build image cho worker container
├── docker-compose.yml      # Orchestrate cả 2 container (local dev)
└── Backend/moneymanager/src/main/resources/
    ├── application.properties          # Base config (shared)
    ├── application-api.properties      # Profile: api — tắt scheduled jobs
    └── application-worker.properties   # Profile: worker — tắt web server
```

---

## Cách chạy local (dev/test)

```bash
# Chạy cả 2 container
docker compose up --build

# Chỉ API
docker compose up api --build

# Chỉ Worker
docker compose up worker --build

# Xem logs
docker compose logs -f api
docker compose logs -f worker
```

---

## Cách build image riêng lẻ (production)

```bash
# Build API image
docker build -f Dockerfile.api -t moneymanager-api:latest .

# Build Worker image
docker build -f Dockerfile.worker -t moneymanager-worker:latest .
```

---

## Phân chia tính năng theo profile

### Profile `api` (bật)
- Tất cả REST Controllers
- AI: AIChatController, GeminiController, ForecastController, SpendingTipsController
- Security: JWT filter, CORS, rate limit interceptor
- Email khi được gọi qua API (EmailController)
- Upload file, Payment webhook

### Profile `api` (tắt)
- `@Scheduled` jobs (không chạy cron trong API container)
- DB/MongoDB seeders (không chạy khi start)

### Profile `worker` (bật)
- NotificationService scheduled jobs:
  - `sendDailyIncomeExpenseReminder()` — 22:00 VN
  - `sendDailyExpenseSummary()` — 23:00 IST
  - `sendMonthlyReportCardNotification()` — 8:00 ngày 1 hằng tháng
  - `sendDailySavingStreakReminder()` — 21:00 IST
- PaymentService scheduled job:
  - `syncPendingPayments()` — mỗi 30 giây (đồng bộ trạng thái PayOS)
- TransactionEventHandler (async event handlers)
- RoleInitializer, MongoCollectionInitializer, SubscriptionPlanSeeder

### Profile `worker` (tắt)
- HTTP server (không expose port)
- Spring Security / JWT filter
- WebMvc / REST controllers
- AI features

---

## Deploy lên AWS (EC2 Auto Scaling)

- **API instances**: Chạy image `moneymanager-api` với env `SPRING_PROFILES_ACTIVE=api`
  - Có thể scale ngang nhiều EC2 instance
  - Đặt sau ALB
  
- **Worker instance**: Chạy image `moneymanager-worker` với env `SPRING_PROFILES_ACTIVE=worker`
  - Chỉ cần **1 instance** (tránh cron chạy duplicate)
  - Không cần đặt sau ALB
  - Nên dùng EC2 riêng hoặc ASG với min=max=1

---

## Lưu ý quan trọng

1. **Worker chỉ nên có 1 instance** — nếu scale worker lên 2+ instances, các `@Scheduled` jobs sẽ chạy duplicate. Giải pháp lâu dài: dùng ShedLock hoặc chuyển sang EventBridge Scheduler.

2. **Seeders chỉ chạy ở worker** — nếu là lần deploy đầu tiên, đảm bảo worker đã chạy trước khi API nhận traffic.

3. **`app.ai.enabled=false` trong worker** — worker không cần Gemini/GPT key rotation, tiết kiệm tài nguyên.

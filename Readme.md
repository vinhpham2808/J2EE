# Money Manager — Quản Lý Tài Chính Cá Nhân

Ứng dụng quản lý tài chính cá nhân toàn diện cho **Web** và **Mobile**. Hỗ trợ theo dõi thu nhập/chi tiêu, lập ngân sách, quản lý hũ tiết kiệm, mục tiêu tiết kiệm, dự báo tài chính AI, xuất báo cáo Excel/Email, import hóa đơn bằng ảnh (OCR), và trợ lý AI tích hợp — **Nova Money**.

---

## Kiến Trúc Hệ Thống

```
┌─────────────────┐     REST API / JWT      ┌──────────────────────┐
│   Frontend      │ ◄──────────────────────► │   Backend            │
│   React 19      │                          │   Spring Boot 4.0.3  │
│   Vite 8 (beta) │                          │   Java 21 / MySQL    │
└─────────────────┘                          └──────────┬───────────┘
                                                        │
┌─────────────────┐     REST API / JWT                  │
│   Mobile        │ ◄──────────────────────────────────►│
│   React Native  │                          ┌──────────┴───────────┐
│   Expo 53       │                          │   External Services  │
└─────────────────┘                          │   Redis · MySQL      │
                                             │   MongoDB (chat)     │
                                             │   PayOS · PayOS QR   │
                                             │   Gemini API         │
                                             │   OpenRouter (GPT)   │
                                             │   AWS S3 · Lambda    │
                                             │   Brevo SMTP         │
                                             └──────────────────────┘
```

---

## Công Nghệ Sử Dụng

### Backend — `Backend/moneymanager/`

| Danh Mục | Công Nghệ | Chi Tiết |
|---|---|---|
| Framework | Spring Boot | 4.0.3 |
| Ngôn Ngữ | Java | 21 |
| Build Tool | Maven Wrapper | `mvnw.cmd` |
| Database chính | MySQL + JPA/Hibernate | Schema quan hệ đầy đủ |
| Database chat | MongoDB | Lưu lịch sử hội thoại AI |
| Cache / Session | Redis | API key pool, rate limit, cache |
| Authentication | Spring Security + JWT | Cookie `mm_token`, Google OAuth2 |
| AI — Chat (FREE) | Google Gemini API | `gemini-*-flash-lite` |
| AI — Chat (PREMIUM) | OpenRouter (GPT-OSS 120B) | Via `gptoss.*` config |
| AI — Agent (Intent) | Google Gemini API | Intent parsing + CRUD execution |
| AI — Forecast Insight | Google Gemini API | `/forecast/insights` |
| AI — Report Analysis | OpenRouter (GPT-OSS) | `/reports/ai-analysis` |
| AI — Smart Tips | Google Gemini API | Spending tips, 3-month data |
| AI — OCR Receipt | Google Gemini Vision | Import hóa đơn ảnh/PDF |
| Thanh Toán | PayOS | Webhook `PAID` → kích hoạt gói |
| Excel Export | Apache POI | Báo cáo thu/chi đa sheet |
| Email | Spring Mail (Brevo SMTP) | Báo cáo định kỳ, OTP, PDF |
| File Storage | AWS S3 | Ảnh hóa đơn, file upload |
| PDF Invoice | AWS Lambda | Render hóa đơn PDF |
| Utilities | Lombok, Jackson | Giảm boilerplate, JSON |

**Layer Pattern**: `@Controller → @Service → @Repository` + DTO layer riêng biệt

**AI Key Management**:
- **Gemini**: Pool nhiều API key, round-robin + cooldown tự động qua `GeminiKeyRotator`
- **GPT-OSS**: Pool nhiều key qua `GptOssKeyRotator`, retry 3 lần với exponential backoff (400ms base)
- **OCR**: Pool key riêng qua `OcrKeyRotator`

### Frontend — `Frontend/`

| Danh Mục | Công Nghệ | Phiên Bản |
|---|---|---|
| Framework | React | 19.2 |
| Build Tool | Vite | 8.0 (beta) |
| CSS | Tailwind CSS | 4.2 |
| Routing | React Router DOM | 7.13 |
| HTTP | Axios | 1.13 |
| Charts | Recharts | 3.8 |
| Icons | Lucide React | 0.577 |
| Drag & Drop | @dnd-kit/core + sortable | 6/10 |
| Markdown | react-markdown + remark-gfm + rehype-sanitize + rehype-raw | 10.1 |
| Notifications | react-hot-toast | 2.6 |
| Emoji Picker | emoji-picker-react | 4.18 |
| Date | moment.js | 2.30 |

**Frontend Tests**: Node built-in test runner (`node --test`) cho unit tests utility functions.

### Mobile — `Mobile/`

| Danh Mục | Công Nghệ | Phiên Bản |
|---|---|---|
| Framework | React Native | 0.79.6 |
| Build Platform | Expo | 53 |
| Navigation | React Navigation (bottom tab + native stack) | 7 |
| Local Storage | AsyncStorage | 2.1 |
| HTTP | Axios | 1.13 |

---

## Các Gói Đăng Ký

Ba cấp độ kiểm soát quyền truy cập tính năng. Các hạn chế được thực thi **ở tầng service backend** — frontend chỉ ẩn UI.

| Tính Năng | FREE | BASIC | PREMIUM |
|---|:---:|:---:|:---:|
| Danh Mục tối đa | 10 | 30 | Không giới hạn |
| Giao Dịch / tháng | 100 | 1.000 | Không giới hạn |
| Hũ Chi Tiêu (Jars) | 1 | 6 | Không giới hạn |
| History Filter | 3 tháng | 12 tháng | Không giới hạn |
| Xuất Excel | ❌ | ✅ | ✅ |
| Báo Cáo Email | ❌ | ✅ | ✅ |
| Nova Money Chat | ✅ Gemini | ✅ Gemini | ✅ GPT-OSS + Gemini |
| Nova Money Agent (CRUD) | ❌ | ✅ Gemini | ✅ Gemini |
| Receipt Import (OCR Vision) | ❌ | ❌ | ✅ Gemini Vision |
| AI Smart Tips | ❌ | ❌ | ✅ Gemini |
| Dự Báo Tài Chính + AI Insights | ❌ | ❌ | ✅ Gemini |
| Báo Cáo Tháng + AI Analysis | ❌ | ❌ | ✅ GPT-OSS |

**Backend enforcement points**: `CategoryService`, `ExpenseService`, `IncomeService`, `JarService`, `FilterController`, `ExcelService`, `EmailService`, `ReceiptImportService`, `SpendingTipsService`, `ForecastService`, `MonthlyReportCardService`

**Subscription flow**: Người dùng thanh toán qua PayOS QR → webhook `PAID` → backend kích hoạt gói trên `ProfileEntity` (`subscriptionPlan`, `subscriptionStatus`, `subscriptionActivatedAt`, `subscriptionExpiresAt`, `autoRenew`)

---

## Tính Năng AI — Nova Money

### Tổng Quan

Nova Money là trợ lý AI tích hợp sẵn, có hai chế độ hoạt động:

```
┌──────────────────────────────────────────────────┐
│                   Nova Money                     │
├──────────────────────┬───────────────────────────┤
│     Agent Mode       │      Chat Mode            │
│     BASIC+           │      Tất cả gói           │
│                      │                           │
│  Intent Parsing →    │  Q&A tự do                │
│  CRUD / Export /     │  Lời khuyên tài chính     │
│  Jar Transfer        │  Tâm lý chi tiêu          │
│  Xác nhận → Undo     │  Kế hoạch dài hạn         │
└──────────────────────┴───────────────────────────┘
```

### Phân Bổ Model Theo Tính Năng

| Tính Năng | Provider | Model | Plan |
|---|---|---|---|
| Chat (mặc định) | Google Gemini | gemini-*-flash-lite | FREE+ |
| Chat (cao cấp) | OpenRouter | GPT-OSS 120B | PREMIUM |
| Agent Intent Parser | Google Gemini | gemini-*-flash-lite | BASIC+ |
| Forecast AI Insights | Google Gemini | gemini-*-flash-lite | PREMIUM |
| Monthly Report AI Analysis | OpenRouter | GPT-OSS 120B | PREMIUM |
| AI Smart Tips | Google Gemini | gemini-*-flash-lite | PREMIUM |
| Receipt OCR Import | Google Gemini Vision | gemini-*-flash | PREMIUM |

### Agent Mode — Intent → CRUD Pipeline

**Có sẵn từ gói BASIC.** Người dùng nhập lệnh ngôn ngữ tự nhiên → AI parse intent → frontend hiển thị confirmation form → người dùng xác nhận → backend thực thi → undo khả dụng.

**Supported Intents**:
- **Chi tiêu**: `CREATE_EXPENSE`, `UPDATE_EXPENSE`, `DELETE_EXPENSE`
- **Thu nhập**: `CREATE_INCOME`, `UPDATE_INCOME`, `DELETE_INCOME`
- **Danh mục**: `CREATE_CATEGORY`, `UPDATE_CATEGORY`, `DELETE_CATEGORY`
- **Ngân sách**: `CREATE_BUDGET`, `UPDATE_BUDGET`, `DELETE_BUDGET`
- **Mục tiêu**: `CREATE_SAVING_GOAL`, `UPDATE_SAVING_GOAL`, `DELETE_SAVING_GOAL`
- **Hũ/Hủ**: `CREATE_JAR`, `UPDATE_JAR`, `DELETE_JAR`, `TRANSFER_JAR`
- **Xuất file**: `EXPORT_EXCEL_INCOME`, `EXPORT_EXCEL_EXPENSE`
- **Email báo cáo**: `EMAIL_INCOME_REPORT`, `EMAIL_EXPENSE_REPORT`
- **Q&A**: `ANSWER_QUESTION`
- **Ngoài phạm vi**: `INVALID_REQUEST`

**Đặc điểm nổi bật**:
- **Context-aware**: System prompt chứa dữ liệu thực tế từ trang hiện tại (danh mục, giao dịch gần đây, ngân sách...) để AI resolve ID thực tế.
- **Prompt Injection Protection**: Lọc pattern injection trước khi gửi đến AI.
- **Heuristic reclassification**: Từ khóa tiếng Việt (`thêm`, `xóa`, `sửa`...) được dùng để phân loại heuristic song song AI.
- **Undo**: Sau CRUD thành công, backend lưu `operationId`. Gọi `DELETE /ai/undo/{operationId}` để đảo ngược.
- **Max message length**: 500 ký tự / lần gửi.

### Chat Mode — Q&A Tự Do

**Có sẵn cho tất cả các gói.** Không thực hiện bất kỳ data operation nào.

- Lời khuyên tài chính cá nhân
- Phân tích tâm lý chi tiêu
- Hỗ trợ cảm xúc / stress tài chính
- Lập kế hoạch mục tiêu dài hạn
- Hướng dẫn sử dụng app

**Conversation history**: 20 tin nhắn cuối được gửi kèm làm context mỗi request. Lịch sử lưu trên **MongoDB**.

**Model Selector**: Người dùng PREMIUM có thể chọn model: GPT-OSS 120B hoặc Gemini.

### Nova Money UI

- **Trang AI Chat chuyên biệt** (`/ai-chat`): Giao diện toàn màn hình, hiện đại, responsive.
- **Floating Widget**: Nút góc phải dưới trên các trang khác; **Greeting bubble** xuất hiện sau 5 giây.
- **Markdown rendering**: Table, code block, list, blockquote, bold/italic.
- **Pending Intent Guard**: Khi form xác nhận CRUD đang mở, block nhắn tin tiếp.

---

## Tính Năng Cốt Lõi

### Quản Lý Thu Nhập (`/income`)
Ghi nhận thu nhập, tự động phân bổ vào các **Hũ Chi Tiêu (Jars)** theo tỷ lệ % định trước. Hỗ trợ CRUD đầy đủ.

### Quản Lý Chi Tiêu (`/expense`)
Ghi nhận chi tiêu, gán danh mục, upload hóa đơn (OCR với Gemini Vision — PREMIUM), **Chi Tiêu Nhanh (Templates)** 1-click. Khi tạo chi tiêu, người dùng chọn trực tiếp Hũ trừ tiền.

### Quản Lý Danh Mục (`/category`)
Tạo, sửa, xóa danh mục thu chi. Phân loại qua hệ thống biểu tượng (Emoji Picker) và màu sắc.

### Bộ Lọc Nâng Cao (`/filter`)
Tìm kiếm và lọc giao dịch lịch sử theo thời gian, loại, danh mục. Giới hạn: 3 tháng (FREE), 12 tháng (BASIC), Không giới hạn (PREMIUM).

### Báo Cáo Tài Chính (`/reports`)
Báo cáo tổng hợp từng tháng bằng **MonthlyReportCard**:
- Thang điểm tài chính (Spending Score A–F)
- Phân tích danh mục qua biểu đồ trực quan
- Badges thành tích (🏆 Tiết kiệm xuất sắc, 📊 Ngân sách chặt chẽ...)
- Điểm mạnh và điểm cần cải thiện (rule-based)
- **AI Analysis** chuyên sâu bằng **GPT-OSS** (PREMIUM, on-demand)

### Dự Báo Tài Chính (`/forecast`) — PREMIUM Only
- Dự đoán chi tiêu 6 tháng tới (hiện tại + 5 tháng tiếp theo) dựa trên 6 tháng lịch sử
- **Anomaly Detection**: Phát hiện khoản chi bất thường
- **AI Insights**: Phân tích dự báo chi tiết bằng **Gemini** (`POST /forecast/insights`) — tối ưu trải nghiệm tải bất đồng bộ không gây khóa màn hình toàn cục
- Biểu đồ BarChart tương tác (Recharts)

### Quản Lý Ngân Sách (`/budget`)
Đặt giới hạn chi tiêu hàng tháng theo danh mục. Theo dõi % sử dụng và cảnh báo khi vượt mức.

### Hệ Thống Hũ Chi Tiêu (`/jars`)
Phân bổ thu nhập vào nhiều "ví phụ" riêng biệt theo tỷ lệ %:
- **Giới hạn**: FREE (1 Hũ), BASIC (6 Hũ), PREMIUM (Không giới hạn)
- **Phân bổ tự động**: Khi có thu nhập mới, tự phân bổ theo tỷ lệ định trước
- **Chuyển tiền**: Luân chuyển số dư giữa các Hũ (AI Agent hỗ trợ `TRANSFER_JAR`)
- **Thanh toán từ Hũ**: Mọi chi tiêu đều chỉ định trừ từ Hũ cụ thể

### Mục Tiêu Tiết Kiệm (`/saving-goals`)
Quản lý mục tiêu (Mua xe, Du lịch...) với số tiền kỳ vọng và deadline. Ghi nhận đóng góp, theo dõi tiến độ. AI Agent nhận diện chính xác trạng thái mục tiêu.

### Dashboard Tổng Quan (`/dashboard`)
Widgets hỗ trợ **kéo thả** (`@dnd-kit`), thống kê số dư, chi tiêu gần đây, truy cập nhanh tính năng.

### Thông Báo (`/notifications`)
Trung tâm thông báo hệ thống (ngân sách vượt mức, đăng ký sắp hết hạn, v.v.).

---

## Bảo Mật & Hạ Tầng

| Tính Năng | Mô Tả |
|---|---|
| JWT Authentication | Cookie `mm_token`, HttpOnly, SameSite |
| Google OAuth2 | Đăng nhập qua Google |
| OTP Verification | Xác thực tài khoản qua email |
| Spam Protection | Rate limiting via `SpamProtectionService` + Redis |
| Prompt Injection Guard | Pattern matching trước khi gửi AI |
| HTTPS / HSTS | Header bảo mật cấu hình ở `SecurityConfig` |
| Input Sanitization | Max length 500 ký tự / message AI |
| Role-based Access | ROLE_USER / ROLE_ADMIN |

---

## Các Tiện Ích Khác

- **Xuất Excel** (`BASIC+`): Báo cáo thu/chi đa sheet, màu sắc phân loại (Apache POI)
- **Xuất PDF Invoice** (PREMIUM): Hóa đơn thanh toán qua AWS Lambda
- **Hóa đơn & Thanh toán** (`/payment`): Quản lý lịch sử hóa đơn an toàn, đồng bộ trạng thái, tích hợp hộp thoại xác nhận (Custom Modal Confirmation) đồng bộ toàn hệ thống thay thế cho `confirm` của trình duyệt
- **Báo cáo Email** (`BASIC+`): Gửi qua Brevo SMTP, template HTML
- **Low Performance Mode**: Tắt animation trên thiết bị yếu
- **Admin Dashboard** (`/admin`): Quản lý người dùng, thống kê doanh thu, broadcast thông báo
- **React Native Mobile App**: Bottom tab navigation, đồng bộ 100% với Web

---

## Default Ports

| Service | Port |
|---|---|
| Backend (Spring Boot) | 8080 |
| Frontend (Vite dev) | 3000 |
| MySQL | 3306 |
| Redis | 6379 |
| MongoDB | 27017 |

---

## Quick Start

```bash
# Backend
cd Backend/moneymanager
.\mvnw.cmd spring-boot:run
# Hoặc: mvn spring-boot:run

# Frontend
cd Frontend
npm install
npm run dev          # http://localhost:3000

# Mobile
cd Mobile
npm install
npm start            # Expo Go

# Compile only (không chạy)
cd Backend/moneymanager
.\mvnw.cmd clean compile
```

---

## Cấu Trúc Thư Mục

```
J2EE/
├── Backend/moneymanager/
│   └── src/main/java/com/example/moneymanager/
│       ├── config/          # Gemini, GptOss, OCR, Redis, Security, PayOS, AWS
│       ├── controller/      # 24 REST controllers
│       ├── dto/             # Data Transfer Objects
│       ├── entity/          # JPA Entities (MySQL) + Enums
│       ├── repository/      # Spring Data JPA repositories
│       ├── service/         # 32 services (business logic)
│       ├── security/        # JWT filter, UserPrincipal
│       ├── util/            # AIInstructionPromptBuilder, parsers
│       ├── event/           # Application events
│       └── exception/       # Custom exceptions
├── Frontend/
│   └── src/
│       ├── pages/           # 23 page components
│       ├── components/      # Shared UI components
│       ├── context/         # React contexts
│       └── util/            # API endpoints, helpers, tests
└── Mobile/
    └── (React Native / Expo)
```

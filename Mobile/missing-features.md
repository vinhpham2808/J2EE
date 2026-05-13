# 📱 Mobile Missing Features

> Danh sách các chức năng đã có ở Backend và Frontend (Web) nhưng **chưa có** ở Mobile (React Native).
> 
> Cập nhật: 13/05/2026

---

## 🔴 Nhóm 1: AI & Phân tích thông minh

| # | Chức năng | Backend API | Frontend Web | Ưu tiên |
|---|-----------|-------------|-------------|---------|
| 1 | **AI Insights trên Dashboard** | `GET /dashboard/ai-insight` | `Home.jsx` | 🔥 P0 |
| 2 | **AI Insights chi tiết** | `GET /dashboard/ai-insight/detailed` | `Home.jsx` | 🔥 P0 |
| 3 | **AI Chat với Gemini** | `POST /gemini/chat` | `ChatWidget.jsx` | 🔥 P0 |
| 4 | **Dự báo chi tiêu hàng tháng** | `GET /forecast/monthly` | `Forecast.jsx` | 🔥 P1 |
| 5 | **Phát hiện bất thường chi tiêu** | `GET /forecast/anomalies` | `Forecast.jsx` | 🔥 P1 |
| 6 | **Phân tích xu hướng danh mục** | `GET /forecast/category-trend/{categoryId}` | `Forecast.jsx` | 🔥 P1 |
| 7 | **AI Insights cho Forecast** | `POST /forecast/insights` | `Forecast.jsx` | 🔥 P1 |

### Chi tiết:

#### 1-2. AI Insights trên Dashboard
- **Mô tả**: Hiển thị phân tích tài chính thông minh ngay trên màn hình Dashboard, bao gồm tóm tắt và phân tích chi tiết (có subscription-gated).
- **Backend**: `DashboardController` → `GET /dashboard/ai-insight`, `GET /dashboard/ai-insight/detailed`
- **Frontend**: `Home.jsx` có section AI insights với khả năng expand/collapse
- **Mobile hiện tại**: `DashboardScreen.js` không có AI insights

#### 3. AI Chat với Gemini
- **Mô tả**: Chatbot AI giúp người dùng trả lời câu hỏi về tài chính cá nhân, gợi ý tiết kiệm, tư vấn quản lý chi tiêu.
- **Backend**: `GeminiController` → `POST /gemini/chat`
- **Frontend**: `ChatWidget.jsx` - floating chat bubble với quick prompts, format tin nhắn
- **Mobile hiện tại**: Không có màn hình chat AI

#### 4-7. Dự báo & Phân tích (Forecast)
- **Mô tả**: Dự báo chi tiêu theo danh mục, phát hiện giao dịch bất thường, phân tích xu hướng, AI insights. Tính năng PREMIUM.
- **Backend**: `ForecastController` → 4 endpoints
- **Frontend**: `Forecast.jsx` - đầy đủ UI với biểu đồ, trend indicators, paywall cho FREE
- **Mobile hiện tại**: Không có màn hình Forecast

---

## 🔴 Nhóm 2: Báo cáo & Xuất dữ liệu

| # | Chức năng | Backend API | Frontend Web | Ưu tiên |
|---|-----------|-------------|-------------|---------|
| 8 | **Báo cáo tài chính hàng tháng** | `GET /reports/monthly` | `Reports.jsx` | 🔥 P1 |
| 9 | **Xuất Excel chi tiêu** | `GET /excel/download/expense` | `Expense.jsx` | ⚡ P2 |
| 10 | **Xuất Excel thu nhập** | `GET /excel/download/income` | `Income.jsx` | ⚡ P2 |
| 11 | **Gửi báo cáo qua Email** | `GET /email/income-excel` | Web (BASIC+) | ⚡ P2 |
| 12 | **Tạo hóa đơn PDF** | `POST /documents/invoice` | `Reports.jsx` | 💤 P3 |

### Chi tiết:

#### 8. Báo cáo tài chính hàng tháng (Monthly Report Card)
- **Mô tả**: Báo cáo điểm tài chính (A-F), key metrics (thu nhập, chi tiêu, tiết kiệm, số dư), phân tích chi tiêu theo danh mục, % thay đổi so với tháng trước.
- **Backend**: `MonthlyReportCardController` → `GET /reports/monthly`, `GET /reports/monthly/{year}/{month}`
- **Frontend**: `Reports.jsx` - UI đầy đủ với letter grade, spending breakdown, month navigation
- **Mobile hiện tại**: Không có màn hình Reports

#### 9-10. Xuất Excel
- **Mô tả**: Tải file Excel báo cáo chi tiêu / thu nhập. Yêu cầu gói BASIC+.
- **Backend**: `ExcelController` → `GET /excel/download/expense`, `GET /excel/download/income`
- **Frontend**: `Expense.jsx`, `Income.jsx` có nút Export (locked cho FREE)
- **Mobile hiện tại**: Không có chức năng export

#### 11. Gửi báo cáo qua Email
- **Mô tả**: Gửi báo cáo Excel qua email. Yêu cầu gói BASIC+.
- **Backend**: `EmailController` → `GET /email/income-excel`, `GET /email/expense-excel`
- **Frontend**: Web có chức năng này
- **Mobile hiện tại**: Không có

#### 12. Tạo hóa đơn PDF
- **Mô tả**: Tạo hóa đơn/invoice dạng PDF cho giao dịch.
- **Backend**: `DocumentController` → `POST /documents/invoice`
- **Frontend**: Có trong `Reports.jsx`
- **Mobile hiện tại**: Không có

---

## 🔴 Nhóm 3: Quản lý chi tiêu nâng cao

| # | Chức năng | Backend API | Frontend Web | Ưu tiên |
|---|-----------|-------------|-------------|---------|
| 13 | **Quét & phân tích hóa đơn bằng AI** | `POST /expenses/import-receipt/*` | `Expense.jsx` | 🔥 P1 |
| 14 | **Quick Expense Templates** | ❌ (localStorage) | `QuickExpenseTemplates.jsx` | ⚡ P2 |
| 15 | **Finance Overview Pie Chart** | N/A | `FinanceOverview.jsx` | ⚡ P2 |

### Chi tiết:

#### 13. Quét & phân tích hóa đơn bằng AI (Receipt Import)
- **Mô tả**: Chụp ảnh hóa đơn → AI (Gemini) tự động trích xuất: merchant, số tiền, ngày, danh mục. Có bước preview và confirm trước khi lưu.
- **Backend**: `ExpenseController` → `POST /expenses/import-receipt`, `/import-receipt/analyze`, `/import-receipt/confirm`
- **Frontend**: `Expense.jsx` có nút "Receipt Import" với loading spinner, receipt preview modal, confirm step
- **Mobile hiện tại**: `AddExpenseScreen` có voice input và smart note parsing nhưng **không có** receipt image import

#### 14. Quick Expense Templates
- **Mô tả**: Mẫu chi tiêu nhanh (VD: "Ăn cơm 50k", "Cà phê 35k", "Xăng xe 100k") - 1 chạm để thêm expense.
- **Backend**: Không (lưu trong localStorage)
- **Frontend**: `QuickExpenseTemplates.jsx` - có sẵn 6 mẫu mặc định, hỗ trợ thêm/sửa/xóa, emoji picker
- **Mobile hiện tại**: Không có

#### 15. Finance Overview Pie Chart
- **Mô tả**: Biểu đồ tròn hiển thị cơ cấu tài chính (Tiết kiệm, Đầu tư, Tiền mặt, Dự trữ) với % phân bổ.
- **Frontend**: `FinanceOverview.jsx` - pie chart với màu sắc trực quan
- **Mobile hiện tại**: `DashboardScreen` có chart đơn giản hơn, không có pie chart cơ cấu

---

## 🔴 Nhóm 4: Thông báo & Cài đặt

| # | Chức năng | Backend API | Frontend Web | Ưu tiên |
|---|-----------|-------------|-------------|---------|
| 16 | **Trung tâm thông báo đầy đủ** | `GET/PUT /notifications/*` | `Notifications.jsx` | 🔥 P0 |
| 17 | **Cài đặt Email Notification** | `GET/PUT /profile/email-preferences` | `EmailNotificationSettings.jsx` | ⚡ P2 |

### Chi tiết:

#### 16. Trung tâm thông báo (Notifications Screen)
- **Mô tả**: Màn hình riêng hiển thị tất cả thông báo với filter All/Unread, đánh dấu đã đọc từng cái hoặc tất cả, hiển thị thời gian tương đối, color-coded theo loại thông báo.
- **Backend**: `NotificationController` → `GET /notifications`, `GET /notifications/unread-count`, `PUT /notifications/{id}/read`, `PUT /notifications/read-all`
- **Frontend**: `Notifications.jsx` - đầy đủ UI, 7 loại thông báo (Expense, Income, Budget, Saving Goal, Report, Payment, Admin)
- **Mobile hiện tại**: Chỉ có bell icon trên `DashboardScreen`, **không có** màn hình Notification riêng

#### 17. Cài đặt Email Notification
- **Mô tả**: Bật/tắt từng loại thông báo qua email (transaction alerts, budget warnings, monthly reports, v.v.)
- **Backend**: `ProfileController` → `GET /profile/email-preferences`, `PUT /profile/email-preferences`, `POST /profile/email-preferences/reset`
- **Frontend**: `EmailNotificationSettings.jsx` - toggle switches cho từng loại, nút Save/Reset
- **Mobile hiện tại**: Không có trong `ProfileScreen` hay `EditProfileScreen`

---

## 🔴 Nhóm 5: Trải nghiệm người dùng & Khác

| # | Chức năng | Backend API | Frontend Web | Ưu tiên |
|---|-----------|-------------|-------------|---------|
| 18 | **Tùy chỉnh Dashboard Widget** | ❌ | `Home.jsx` | 💤 P3 |
| 19 | **Admin Panel** | `GET/PUT/POST/DELETE /admin/*` | `Admin/` | ❌ (web-only) |

### Chi tiết:

#### 18. Tùy chỉnh Dashboard Widget
- **Mô tả**: Kéo thả sắp xếp lại widget, ẩn/hiện từng widget trên Dashboard.
- **Frontend**: `Home.jsx` - drag-and-drop, visibility toggle, settings panel
- **Mobile hiện tại**: Không có

#### 19. Admin Panel
- **Mô tả**: Quản lý users, payments, gửi broadcast notification, xem thống kê hệ thống.
- **Backend**: `AdminController` → 10 endpoints
- **Frontend**: `Admin/` pages
- **Mobile**: Không cần thiết (web-only)

---

## ✅ So sánh ngược: Mobile CÓ nhưng Frontend Web KHÔNG có

| # | Chức năng | Vị trí Mobile |
|---|-----------|---------------|
| 1 | **Voice Input** - Nhập chi tiêu bằng giọng nói | `AddExpenseScreen.js` |
| 2 | **Smart Note Parsing** - Tự động trích xuất số tiền, danh mục từ ghi chú | `AddExpenseScreen.js` |
| 3 | **Split Expense** - Hỗ trợ chia tiền từ ghi chú | `AddExpenseScreen.js` |
| 4 | **Onboarding Flow** - 3 slide giới thiệu cho người dùng mới | `OnboardingScreen.js` |

---

## 🎯 Kế hoạch phát triển đề xuất

### Giai đoạn 1: P0 (Cần làm ngay)
- [ ] **AI Insights trên Dashboard** - Tận dụng API `GET /dashboard/ai-insight`
- [ ] **AI Chat với Gemini** - Tạo `ChatScreen.js`, dùng `POST /gemini/chat`
- [ ] **Trung tâm thông báo** - Tạo `NotificationsScreen.js`, dùng `GET/PUT /notifications/*`

### Giai đoạn 2: P1 (Quan trọng)
- [ ] **Quét hóa đơn bằng AI** - Thêm receipt import vào `AddExpenseScreen`
- [ ] **Báo cáo tài chính hàng tháng** - Tạo `ReportsScreen.js`
- [ ] **Dự báo & Phát hiện bất thường** - Tạo `ForecastScreen.js`

### Giai đoạn 3: P2 (Nên có)
- [ ] **Xuất Excel** - Thêm nút Export vào `ExpenseScreen`/`IncomeScreen`
- [ ] **Gửi báo cáo qua Email** - Thêm option trong Reports
- [ ] **Cài đặt Email Notification** - Thêm vào `EditProfileScreen`
- [ ] **Quick Expense Templates** - Thêm vào `AddExpenseScreen`
- [ ] **Finance Overview Pie Chart** - Cải thiện chart trên `DashboardScreen`

### Giai đoạn 4: P3 (Thấp)
- [ ] **Tạo hóa đơn PDF** - Ít nhu cầu trên mobile
- [ ] **Tùy chỉnh Dashboard Widget** - Phức tạp, ít giá trị trên mobile

---

## 📋 Chi tiết API endpoints cần tích hợp

| Endpoint | Method | Mô tả | Màn hình đích |
|----------|--------|-------|---------------|
| `/dashboard/ai-insight` | GET | AI insight tóm tắt | DashboardScreen |
| `/dashboard/ai-insight/detailed` | GET | AI insight chi tiết | DashboardScreen |
| `/gemini/chat` | POST | Chat với AI | ChatScreen (mới) |
| `/notifications` | GET | Danh sách thông báo | NotificationsScreen (mới) |
| `/notifications/unread-count` | GET | Số thông báo chưa đọc | DashboardScreen |
| `/notifications/{id}/read` | PUT | Đánh dấu đã đọc | NotificationsScreen |
| `/notifications/read-all` | PUT | Đánh dấu tất cả đã đọc | NotificationsScreen |
| `/expenses/import-receipt` | POST | Upload ảnh hóa đơn | AddExpenseScreen |
| `/expenses/import-receipt/analyze` | POST | AI phân tích hóa đơn | AddExpenseScreen |
| `/expenses/import-receipt/confirm` | POST | Xác nhận import | AddExpenseScreen |
| `/reports/monthly` | GET | Báo cáo tháng hiện tại | ReportsScreen (mới) |
| `/reports/monthly/{year}/{month}` | GET | Báo cáo tháng cụ thể | ReportsScreen |
| `/forecast/monthly` | GET | Dự báo chi tiêu | ForecastScreen (mới) |
| `/forecast/anomalies` | GET | Phát hiện bất thường | ForecastScreen |
| `/forecast/category-trend/{id}` | GET | Xu hướng danh mục | ForecastScreen |
| `/forecast/insights` | POST | AI insights forecast | ForecastScreen |
| `/excel/download/expense` | GET | Xuất Excel chi tiêu | ExpenseScreen |
| `/excel/download/income` | GET | Xuất Excel thu nhập | IncomeScreen |
| `/email/income-excel` | GET | Gửi email báo cáo thu | ReportsScreen |
| `/email/expense-excel` | GET | Gửi email báo cáo chi | ReportsScreen |
| `/profile/email-preferences` | GET/PUT | Cài đặt email notif | EditProfileScreen |
| `/documents/invoice` | POST | Tạo PDF hóa đơn | (P3) |

---

> **Tổng cộng: 19 chức năng thiếu, 22 API endpoints cần tích hợp**

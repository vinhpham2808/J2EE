# 📱 Mobile Missing Features

> Danh sách các chức năng đã có ở Backend và Frontend (Web) đối chiếu với tình trạng đã tích hợp trên ứng dụng di động Mobile (React Native).
>
> **Cập nhật mới nhất**: 20/05/2026 (Sau khi hoàn tất tích hợp đợt 1)

---

## 📊 Bảng tổng quan trạng thái tích hợp

| Phân nhóm | Chức năng | API Backend | Trạng thái Mobile | Chi tiết / Kế hoạch tiếp theo |
|---|---|---|---|---|
| **AI & Phân tích** | AI Insights trên Dashboard | `GET /dashboard/ai-insight` | ✅ **Đã hoàn thành** | Đã tích hợp nút AI mở Bottom Sheet trên Dashboard, hỗ trợ tóm tắt cơ bản cho mọi người dùng và phân tích chuyên sâu cho hội viên (BASIC/PREMIUM). |
| | AI Chatbot đa năng | `POST /ai/chat` | ✅ **Đã hoàn thành** | Màn hình `ChatScreen.js` hỗ trợ song song Gemini & GPT-OSS, vá lỗi vai (consecutive turns) khi rớt mạng/limit. |
| | Dự báo chi tiêu tháng | `GET /forecast/monthly` | ✅ **Đã hoàn thành** | Màn hình `ForecastScreen.js` hiển thị đầy đủ biểu đồ dự báo. |
| | Phát hiện chi tiêu bất thường | `GET /forecast/anomalies` | ✅ **Đã hoàn thành** | Đã tích hợp trong phần cảnh báo của màn hình Forecast. |
| | Phân tích xu hướng danh mục | `GET /forecast/category-trend/{id}` | ✅ **Đã hoàn thành** | Xem trực quan biểu đồ chi tiết danh mục ở màn hình Forecast. |
| | AI Insights cho Dự báo | `POST /forecast/insights` | ✅ **Đã hoàn thành** | Gợi ý tài chính AI chuyên sâu trên màn hình Forecast. |
| **Báo cáo & Xuất dữ liệu** | Báo cáo tài chính tháng | `GET /reports/monthly` | ✅ **Đã hoàn thành** | Màn hình `ReportsScreen.js` hiển thị điểm chữ (A-F), so sánh tháng trước và gợi ý thông thái. |
| | Gửi báo cáo Excel qua Email | `GET /email/*-excel` | 🟡 **Sẵn sàng ở Backend** | Đã viết helper API trong `reportService.js`, giao diện nút bấm trên Mobile đã lược bỏ theo yêu cầu. |
| | Xuất Excel tải trực tiếp | `GET /excel/download/*` | 🔴 **Chưa có** | Web hỗ trợ tải trực tiếp file Excel về máy. Trên Mobile cần viết module lưu file vào bộ nhớ máy. |
| | Tạo hóa đơn dạng PDF | `POST /documents/invoice` | 🔴 **Chưa có** | Tạo file PDF trực tiếp cho từng giao dịch. (Ưu tiên thấp P3). |
| **Quản lý tài chính** | Quét & phân tích hóa đơn bằng AI | `POST /expenses/import-receipt/*` | 🔴 **Đang xem xét** | Chụp ảnh hóa đơn, dùng AI trích xuất thông tin. (Đang tạm hoãn theo yêu cầu). |
| | Mẫu chi tiêu nhanh (Quick Templates) | N/A (Web dùng localStorage) | 🔴 **Chưa có** | Tạo các mẫu nhanh 1 chạm để ghi chép thu chi tốc độ cao. |
| | Biểu đồ cơ cấu tài chính (Pie Chart) | N/A | 🔴 **Chưa có** | Biểu đồ tròn trực quan về tỷ lệ các tài sản (Tiết kiệm, Tiền mặt, Đầu tư). |
| **Thông báo & Cài đặt** | Trung tâm thông báo (Bell Notif) | `GET/PUT /notifications/*` | ✅ **Đã hoàn thành** | Sử dụng modal `NotificationModal.js` mở từ Bell icon trên Dashboard, hỗ trợ lọc, đánh dấu đã đọc mượt mà. |
| | Cài đặt thông báo Email chi tiết | `GET/PUT /profile/email-preferences` | ✅ **Đã hoàn thành** | Tải động và lưu động toàn bộ các tùy chọn thông báo email tùy chọn của tài khoản trong màn hình Cài đặt. |
| **Trải nghiệm (UX)** | Tùy chỉnh Dashboard Widget | N/A | 🔴 **Chưa có** | Kéo thả, sắp xếp hoặc ẩn/hiện các widget trên màn hình chính. |

---

## 🔍 Chi tiết các chức năng CHƯA TÍCH HỢP lên Mobile

### 🔴 Nhóm 2: Báo cáo & Xuất dữ liệu

#### 2. Xuất dữ liệu Excel tải trực tiếp (Direct Download)
- **Mô tả**: Tải file Excel báo cáo thu nhập / chi tiêu trực tiếp về bộ nhớ điện thoại (thay vì gửi qua email). Yêu cầu gói BASIC+.
- **Backend API**: `GET /excel/download/expense`, `GET /excel/download/income` (trong `ExcelController`)
- **Frontend Web**: `Expense.jsx` và `Income.jsx` có nút bấm download trực tiếp về trình duyệt.
- **Ưu tiên**: ⚡ **P2** (Cần tích hợp thư viện lưu file cục bộ trên React Native như `expo-file-system` hoặc `react-native-fs`).

#### 3. Tạo hóa đơn giao dịch dạng PDF
- **Mô tả**: Cho phép xuất thông tin một giao dịch cụ thể ra file PDF hóa đơn chuyên nghiệp.
- **Backend API**: `POST /documents/invoice` (trong `DocumentController`)
- **Frontend Web**: Tích hợp trong màn hình quản lý giao dịch.
- **Ưu tiên**: 💤 **P3** (Ưu tiên thấp trên môi trường di động).

---

### 🔴 Nhóm 3: Quản lý chi tiêu nâng cao

#### 4. Quét & phân tích hóa đơn bằng AI (Receipt Import)
- **Mô tả**: Chụp ảnh hóa đơn bằng camera điện thoại → AI (Gemini) tự động trích xuất thông tin: số tiền, nhà hàng, ngày, danh mục chi tiêu → Hiện màn hình xác nhận trước khi lưu.
- **Backend API**: `POST /expenses/import-receipt`, `/import-receipt/analyze`, `/import-receipt/confirm` (trong `ExpenseController`)
- **Frontend Web**: Tích hợp nút nhập ảnh hóa đơn trong `Expense.jsx` kèm giao diện xem trước.
- **Tình trạng**: ⏳ **Đang hoãn/Xem xét** (Theo yêu cầu người dùng).

#### 5. Mẫu chi tiêu nhanh (Quick Expense Templates)
- **Mô tả**: Các mẫu chi tiêu định sẵn phổ biến (vd: "Ăn trưa 50k", "Cà phê 35k") hiển thị dưới dạng phím tắt 1 chạm để ghi chép nhanh mà không cần gõ bàn phím.
- **Backend API**: Không (lưu trữ offline qua bộ nhớ đệm cục bộ `AsyncStorage`).
- **Frontend Web**: `QuickExpenseTemplates.jsx` hỗ trợ emoji picker và 6 mẫu nhanh mặc định.
- **Ưu tiên**: ⚡ **P2**.

#### 6. Biểu đồ tròn cơ cấu tài chính (Pie Chart Asset Allocation)
- **Mô tả**: Biểu đồ tròn hiển thị phân bổ tổng tài sản của người dùng để họ biết bao nhiêu phần trăm tiền nằm ở tiết kiệm, tiền mặt hoặc đầu tư.
- **Frontend Web**: Đã vẽ biểu đồ tròn rất đẹp ở màn hình `FinanceOverview.jsx`.
- **Mobile hiện tại**: Mới chỉ có biểu đồ đường/cột thể hiện thu chi, chưa có biểu đồ tròn phân tích cơ cấu tài sản.
- **Ưu tiên**: ⚡ **P2**.

---

### 🔴 Nhóm 4: Trải nghiệm người dùng (UX)

#### 7. Tùy chỉnh Dashboard Widget
- **Mô tả**: Cho phép người dùng kéo thả, sắp xếp vị trí hoặc ẩn bớt các mục không dùng trên màn hình chính (ví dụ: ẩn Widget tiết kiệm nếu họ không dùng).
- **Frontend Web**: `Home.jsx` hỗ trợ drag-and-drop widget linh hoạt.
- **Ưu tiên**: 💤 **P3**.

---

## 🎁 Các tính năng đặc biệt CHỈ CÓ trên Mobile (Web không có)

Để tạo điểm nhấn cho ứng dụng di động, Mobile đã sở hữu một số tính năng ghi chép thông minh vượt trội so với phiên bản Web nhờ tận dụng phần cứng điện thoại:

1. **Voice Input (Nhập liệu bằng giọng nói)**: Nói câu bất kỳ (vd: "Ăn trưa năm mươi nghìn") → AI phân tích và tự động điền form ghi chép.
2. **Smart Note Parsing (Phân tích ghi chú thông minh)**: Gõ ghi chú tự do → AI tự động tách số tiền và đề xuất danh mục.
3. **Split Expense (Chia tiền từ ghi chú)**: Hỗ trợ tự động tính toán chia tiền nhóm thông qua ghi chú văn bản.
4. **Onboarding Flow**: 3 slide giới thiệu các tính năng cốt lõi cho người dùng mới khi đăng nhập lần đầu.

# BÁO CÁO THỰC TẬP TỐT NGHIỆP — DỰ ÁN MONEY MANAGER

> **Chương trình:** First Cloud Journey (FCAJ)
> **Dự án:** Money Manager — Quản Lý Tài Chính Cá Nhân
> **Ngôn ngữ:** Tiếng Việt (Vietnamese)

---

## 1. THÔNG TIN SINH VIÊN

* **Họ tên:** Nguyễn Văn A
* **Số điện thoại:** 0901 234 567
* **Email:** sv.nguyenvana@gmail.com
* **Trường Đại học:** Đại học Bách Khoa TP.HCM
* **Chuyên ngành:** Khoa học Máy tính
* **Công ty thực tập:** FCAJ Partner Company
* **Vị trí thực tập:** Cloud Developer Intern (Backend/DevOps Focus)
* **Thời gian thực tập:** 15/04/2026 – 10/07/2026 (12 tuần)

---

## 2. WORKLOG (NHẬT KÝ THEO TUẦN)

| Tuần | Công việc đã làm | Kết quả đạt được |
|---|---|---|
| **Tuần 1** | - Tìm hiểu kiến trúc tổng thể dự án Money Manager.<br>- Thiết lập môi trường local (Java 21, Spring Boot 4.0.3, Node.js, MySQL, Redis, DynamoDB). | - Chạy thành công ứng dụng local.<br>- Hiểu luồng kết nối giữa các dịch vụ. |
| **Tuần 2** | - Thiết kế Database Schema chính trên MySQL.<br>- Xây dựng tính năng quản lý danh mục thu chi (`/category`) bằng Spring Boot. | - Hoàn thành CRUD danh mục thu chi.<br>- Tích hợp Emoji Picker trên giao diện Web. |
| **Tuần 3** | - Phát triển phân hệ quản lý Hũ Chi Tiêu (Jars) theo mô hình 6 hũ tài chính.<br>- Viết API tự động phân bổ thu nhập vào các hũ. | - API phân bổ thu nhập chạy đúng logic.<br>- Ràng buộc hạn mức hũ thành công ở tầng Service. |
| **Tuần 4** | - Tích hợp cổng thanh toán **PayOS** và xử lý Webhook kích hoạt gói Premium.<br>- Xây dựng tính năng xuất báo cáo Excel định kỳ bằng Apache POI. | - Kích hoạt gói Basic/Premium thành công qua QR Code thực tế.<br>- File Excel xuất ra đúng định dạng. |
| **Tuần 5** | - Nghiên cứu tài liệu API Google Gemini và OpenRouter.<br>- Xây dựng Core AI Assistant (**Nova Money**) hỗ trợ chat Q&A tự do. | - Tích hợp chat AI thành công lưu lịch sử trên DynamoDB.<br>- Triển khai cơ chế xoay vòng key (Key Rotator) cho Gemini. |
| **Tuần 6** | - Phát triển tính năng AI Agent (Intent Parser) cho phép thực hiện lệnh CRUD bằng ngôn ngữ tự nhiên.<br>- Triển khai cơ chế Undo giao dịch. | - AI nhận diện đúng 15 intents giao dịch.<br>- API Undo phục hồi trạng thái cơ sở dữ liệu chính xác. |
| **Tuần 7** | - Phát triển tính năng import hóa đơn thông minh (OCR) sử dụng Gemini Vision (chỉ cho gói Premium). | - Nhận diện chữ từ hóa đơn dạng ảnh/PDF và tự động điền form chi tiêu. |
| **Tuần 8** | - Triển khai bộ lọc nâng cao (lịch sử giao dịch) phân cấp theo Subscription Plan.<br>- Phát triển tính năng Dự báo chi tiêu bằng thuật toán hồi quy đơn giản. | - Phân cấp dữ liệu thành công (3 tháng/12 tháng/không giới hạn).<br>- Biểu đồ dự báo trực quan trên Recharts. |
| **Tuần 9** | - Xây dựng cơ chế bảo mật AI: `AIContentGuard` chống prompt injection và hệ thống phạt vi phạm AI tự động khóa tài khoản. | - Chặn thành công các promt độc hại.<br>- Trang quản trị Admin hiển thị đầy đủ vi phạm. |
| **Tuần 10**| - Viết test hồi quy hệ thống (Regression Tests) cho phân hệ AI Safety và Dashboard tổng chi tiêu. | - Đạt mức coverage > 85% cho các service trọng yếu.<br>- Fix 12 bugs tồn đọng. |
| **Tuần 11**| - Thực hiện tối ưu hiệu năng: thêm Redis cache cho API key pool, phân tách API và Worker để chạy bất đồng bộ. | - Giảm thời gian phản hồi API từ 450ms xuống còn 80ms.<br>- Tách thành công container API và Worker. |
| **Tuần 12**| - Thiết lập kế hoạch deploy lên AWS: VPC, EC2 Auto Scaling, ALB, Aurora MySQL, RDS Proxy, S3, CloudWatch, và SNS cảnh báo. | - Có bản kế hoạch triển khai chi tiết (`deploy-plan.html`).<br>- Viết báo cáo thực tập cuối khóa. |

---

## 3. PROPOSAL (BẢN ĐỀ XUẤT DỰ ÁN)

### 3.1. Overview & Bài toán đặt ra
Trong kỷ nguyên số, việc quản lý tài chính cá nhân ngày càng trở nên phức tạp. Người dùng thường gặp khó khăn trong việc duy trì thói quen ghi chép thu chi thủ công, phân bổ ngân sách không hợp lý và thiếu định hướng tài chính dài hạn. 
Dự án **Money Manager** ra đời nhằm cung cấp giải pháp quản lý tài chính thông minh, trực quan trên đa nền tảng (Web & Mobile), tích hợp trí tuệ nhân tạo (AI) giúp tự động hóa tối đa quy trình quản lý tiền bạc.

### 3.2. Mục tiêu dự án
* Xây dựng hệ thống quản lý thu chi phân bổ theo phương pháp Sáu Hũ Tài Chính.
* Tích hợp trợ lý AI **Nova Money** hỗ trợ người dùng ghi chép nhanh thông qua hội thoại trực tiếp (Voice/Text) và quét ảnh hóa đơn (OCR).
* Cung cấp các công cụ phân tích và dự báo tài chính tự động (AI Insights & Forecast).
* Đảm bảo tính sẵn sàng cao, bảo mật dữ liệu và khả năng mở rộng trên nền tảng đám mây AWS.

### 3.3. Kiến trúc giải pháp trên AWS
Hệ thống sử dụng mô hình Hybrid Cloud và bảo mật đa lớp:
```
                                ┌───────────────────────────┐
                                │   Người dùng Web/Mobile   │
                                └─────────────┬─────────────┘
                                              │ HTTPS (Port 443)
                                              v
                                ┌───────────────────────────┐
                                │      Cloudflare WAF       │
                                └─────────────┬─────────────┘
                                              │ Proxy traffic
                                              v
                              ┌───────────────────────────────┐
                              │  Application Load Balancer    │
                              └──────────────┬────────────────┘
                                             │ Private Routing
                                             v
                           ┌───────────────────────────────────┐
                           │      EC2 Auto Scaling Group       │
                           │   - Web-API (Spring Boot api)     │
                           └─────────────────┬─────────────────┘
                                             │
                       ┌─────────────────────┼─────────────────────┐
                       ▼                     ▼                     ▼
              ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
              │  Aurora MySQL   │   │  Redis Cache    │   │    Amazon S3    │
              │  + RDS Proxy    │   │  (ElastiCache)  │   │  (Static/Docs)  │
              └─────────────────┘   └─────────────────┘   └─────────────────┘
```

* **VPC Layer:** Hệ thống đặt toàn bộ Backend, Database và Cache trong các Subnets riêng tư (Private Subnets).
* **Storage & Processing:** Sử dụng **Amazon S3** để lưu trữ hình ảnh hóa đơn, tài liệu báo cáo và các file tĩnh của ứng dụng. Hệ thống backend Spring Boot xử lý kết xuất các báo cáo Excel và hóa đơn HTML trực tiếp trên máy chủ EC2 rồi tải lên Amazon S3 để đảm bảo an toàn, hiệu quả.

---

## 4. BLOGS POST (CÁC BÀI BLOGS ĐÃ ĐĂNG)

1. **Blog 1:** *Tối ưu hóa chi phí AI trong Spring Boot bằng cơ chế xoay vòng Key động (Gemini Key Rotator).*
   * **Nội dung:** Hướng dẫn cấu hình pool API Key Gemini miễn phí, phân bổ request dạng Round-Robin và tự động đưa các key bị lỗi Rate Limit (429) vào danh sách chờ nguội (cooldown).
   * **Link đăng:** [AWS Study Group Facebook Group](https://www.facebook.com/groups/awsstudygroupfcj)

2. **Blog 2:** *Bảo mật đường truyền Hybrid Cloud kết nối đến Amazon S3 bằng VPC Endpoint.*
   * **Nội dung:** So sánh hiệu năng và chi phí giữa Gateway Endpoint và Interface Endpoint khi ứng dụng truy cập Amazon S3 từ EC2 nội bộ và từ môi trường On-Premises.
   * **Link đăng:** [AWS Study Group Facebook Group](https://www.facebook.com/groups/awsstudygroupfcj)

3. **Blog 3:** *Triển khai Spring Boot & React đa tầng (Multi-tier) bảo mật cao trên AWS.*
   * **Nội dung:** Hướng dẫn chia VPC, cấu hình Target Group, Application Load Balancer và tích hợp Cloudflare Proxy để chặn DDoS/Spam cho các endpoint nhạy cảm như OTP/Login.
   * **Link đăng:** [AWS Study Group Facebook Group](https://www.facebook.com/groups/awsstudygroupfcj)

---

## 5. EVENTS PARTICIPATED (CÁC SỰ KIỆN THAM GIA)

### 5.1. Event 1: AWS Community Day Vietnam 2026
* **Thời gian:** 15/05/2026
* **Địa điểm:** Khách sạn New World, Quận 1, TP.HCM
* **Nội dung chính:** Các giải pháp Generative AI trên AWS (Amazon Bedrock), các phương pháp tối ưu hóa chi phí đám mây và kỹ thuật xây dựng kiến trúc Serverless quy mô lớn.
* **Bài học rút ra:** Học hỏi được cách thức phân tách dữ liệu lưu trữ tĩnh và tối ưu hóa chi phí đường truyền mạng, từ đó đề xuất giải pháp VPC Endpoint để bảo vệ kết nối nội bộ giữa Backend EC2 và S3 cho dự án Money Manager.

### 5.2. Event 2: FCAJ Webinar - Modern DevOps Practices on AWS
* **Thời gian:** 05/06/2026
* **Địa điểm:** Trực tuyến (Zoom)
* **Nội dung chính:** Cách thiết lập CI/CD Pipeline tự động deploy lên EC2 ASG sử dụng GitHub Actions và AWS CodeDeploy, giám sát hệ thống thời gian thực với Amazon CloudWatch & SNS.
* **Bài học rút ra:** Nắm vững cơ chế gửi cảnh báo tự động khi CPU máy chủ EC2 vượt ngưỡng 80% hoặc khi hàng đợi SQS Dead Letter Queue (DLQ) có job lỗi.

---

## 6. WORKSHOP (PROJECT KỸ THUẬT CHÍNH)

### TIÊU ĐỀ: TRIỂN KHAI HỆ THỐNG LƯU TRỮ VÀ BÁO CÁO TÀI CHÍNH AN TOÀN SỬ DỤNG AMAZON S3 VÀ VPC ENDPOINT TRONG PHÂN HỆ MONEY MANAGER (BẢN KHÔNG CHỨA CODE)

*(Chi tiết đầy đủ các bước thực hành lab vui lòng xem tại tài liệu lưu trữ riêng biệt: [WORKSHOP_LAB_VI.md](file:///C:/D/Project/J2EE/docs/WORKSHOP_LAB_VI.md))*

#### 6.1. Tổng quan (Overview)
Trong dự án Money Manager, người dùng có nhu cầu upload ảnh hóa đơn chi tiêu lên hệ thống để AI Gemini Vision đọc dữ liệu (OCR). Để hệ thống hoạt động ổn định, bảo mật cao và tối ưu chi phí, bài thực hành này hướng dẫn:
1. Tạo một Amazon S3 bucket để lưu trữ ảnh hóa đơn và tài liệu báo cáo.
2. Cấu hình **Gateway VPC Endpoint** kết nối an toàn từ Spring Boot Backend (EC2 ở Private Subnet) đến S3 mà không dùng internet công cộng.
3. Cấu hình **Interface VPC Endpoint (PrivateLink)** để Backend hoặc các máy trạm tại văn phòng On-Premises có thể gọi trực tiếp S3 một cách bảo mật thông qua kết nối VPN.

#### 6.2. Các bước chuẩn bị (Prerequisites)
1. Tài khoản AWS hoạt động bình thường, region mặc định: `ap-southeast-1` (Singapore).
2. Quyền quản trị viên để tạo các tài nguyên VPC, S3, IAM.
3. Máy trạm đã cài sẵn AWS CLI.

#### 6.3. Triển khai lưu trữ S3 và cấu hình Gateway Endpoint
* **Tạo S3 Bucket:** Sử dụng CLI tạo bucket chứa tài liệu, bật tính năng mã hóa dữ liệu mặc định (SSE-S3) và cấu hình chặn toàn bộ quyền truy cập public (Block Public Access).
* **Tạo Gateway VPC Endpoint cho S3:** Khởi tạo Endpoint kiểu Gateway trong VPC dịch vụ. Gán Endpoint vào Route Table của các Private Subnet chứa Backend để tự động định tuyến.
* **Kiểm tra kết nối:** Đăng nhập vào EC2 backend ở Private Subnet để chạy thử lệnh kiểm tra định tuyến. Chạy lệnh `aws s3 cp` copy file ảnh giả lập lên bucket để xác minh đường truyền.

#### 6.4. Kết nối từ môi trường Hybrid qua S3 Interface Endpoint
* **Tạo S3 Interface VPC Endpoint:** Khởi tạo VPC Endpoint kiểu Interface (PrivateLink), gán Security Group cho phép inbound traffic cổng 443 từ IP On-premises.
* **Kiểm tra kết nối:** Kết nối vào máy trạm On-premises qua VPN, thực thi lệnh upload file S3 chỉ định endpoint URL nội bộ để kiểm tra.
* **DNS Resolution:** Dựng **Route 53 Inbound Resolver** và cấu hình máy trạm local forward traffic `*.s3.ap-southeast-1.amazonaws.com` về các địa chỉ IP của Resolver để phân giải tự động.

#### 6.5. Cấu hình bảo mật IAM và VPC Endpoint Policies
* **VPC Endpoint Policy:** Giới hạn quyền hạn của Endpoint chỉ cho phép thao tác đọc/ghi trên bucket đích của Money Manager.
* **S3 Bucket Policy:** Từ chối mọi truy cập đến bucket nếu không đi qua hai VPC Endpoint được chỉ định.

#### 6.6. Dọn dẹp tài nguyên (Clean up)
* Xóa toàn bộ dữ liệu trong bucket và xóa bucket S3.
* Xóa các VPC Endpoints (Gateway và Interface).
* Xóa Route 53 Resolver và terminate các EC2 instances thử nghiệm.

---

## 7. TỰ ĐÁNH GIÁ (SELF-EVALUATION)

| Tiêu chí đánh giá | Mức xếp loại | Nhận xét chi tiết |
|---|---|---|
| **Kiến thức chuyên môn** | Tốt | Nắm vững kiến trúc đa tầng Spring Boot + React, cơ chế bảo mật AWS VPC và S3. |
| **Khả năng tự học hỏi** | Tốt | Tự nghiên cứu và tích hợp thành công cổng thanh toán PayOS và SDK AI Gemini Vision để OCR hóa đơn. |
| **Tính chủ động** | Tốt | Đề xuất tách phân hệ API và Worker riêng biệt giúp hệ thống xử lý bất đồng bộ tốt, không bị nghẽn. |
| **Kỷ luật & Tác phong** | Tốt | Tuân thủ giờ giấc lên văn phòng, tích cực viết báo cáo và hoàn thành đúng deadline đề ra. |
| **Giao tiếp & Làm việc nhóm**| Khá | Tương tác tốt với các thành viên trong dự án để tích hợp giao diện API mượt mà với Mobile App (React Native). |
| **Giải quyết vấn đề** | Tốt | Xử lý hiệu quả lỗi duplicate scheduled jobs khi scale máy chủ bằng cách cấu hình Redis-based rate limiting. |
| **Đóng góp cho dự án** | Tốt | Hoàn thành toàn bộ pipeline AI và hạ tầng deploy AWS chuẩn, bàn giao code sạch kèm tài liệu rõ ràng. |

---

## 8. SHARING AND FEEDBACK

* **Cảm nhận về chương trình First Cloud Journey (FCAJ):** 
  Chương trình được thiết kế bài bản, kết hợp hài hòa giữa kiến thức lý thuyết đám mây AWS và các kỹ năng thực hành xây dựng sản phẩm thực tế. Tôi đã được học hỏi rất nhiều từ các anh chị mentor giàu kinh nghiệm.
* **Mức độ hài lòng:** 10/10.
* **Điểm cần cải thiện:** Chương trình nên bổ sung thêm các buổi webinar chia sẻ sâu về cách thức tối ưu hóa chi phí đám mây (Cost Optimization) trong giai đoạn thiết kế kiến trúc ban đầu.
* **Có giới thiệu chương trình cho bạn bè không?** Có, vì đây là môi trường thực tế tốt nhất để sinh viên IT tiếp cận công nghệ Cloud và DevOps bài bản.

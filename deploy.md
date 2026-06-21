# Nhật Ký và Hướng Dẫn Triển Khai Dự Án botdevgroup.me

Tài liệu này ghi lại các bước thực tế đã triển khai và các bước tiếp theo cần thực hiện.

---

## 🟩 BƯỚC 1: Chuẩn bị Domain & SSL (Cloudflare & ACM)
*   **Trạng thái:** Đã hoàn thành.
*   **Chi tiết thực hiện:**
    *   Cấu hình DNS của domain `botdevgroup.me` trỏ về **Cloudflare**.
    *   Yêu cầu chứng chỉ SSL công khai (Public Certificate) từ **AWS Certificate Manager (ACM)** tại Region Singapore (`ap-southeast-1`) cho cả `botdevgroup.me` và `*.botdevgroup.me` (để dùng cho subdomain `api`).
    *   Thêm bản ghi xác thực `CNAME` duy nhất (chung cho cả 2 domain trên) vào cấu hình DNS của **Cloudflare** ở chế độ **DNS Only** (không bật proxy đám mây vàng).
    *   Chứng chỉ đã được AWS xác thực thành công và chuyển sang trạng thái **Issued**.

---

## 🟩 BƯỚC 2: Thiết lập Mạng lưới AWS VPC
*   **Trạng thái:** Đã hoàn thành.
*   **Chi tiết thực hiện:**
    *   Khởi tạo VPC với tùy chọn **"VPC and more"** đặt tên tiền tố là `botdevgroup`.
    *   **Availability Zones (AZs):** Chọn 2 AZs (`ap-southeast-1a` và `ap-southeast-1b`).
    *   **Subnets:** 
        *   2 Public Subnets (cho ALB và NAT Gateway).
        *   4 Private Subnets (2 cho EC2 App và 2 cho Database/Redis).
    *   **NAT Gateways:** Chọn **Regional - new** (1 NAT Gateway dùng chung Multi-AZ để tối ưu chi phí).
    *   **DNS Options:** Bật cả *DNS hostnames* và *DNS resolution*.

---

## 🟨 BƯỚC 3: Triển khai Frontend (Web)
*   **Trạng thái:** Đang thực hiện.
*   **Chi tiết thực hiện:**
    *   **Phần 1: Khởi tạo S3 Bucket & Upload code:** Đã hoàn thành (Tải toàn bộ file trong thư mục `dist` lên thư mục gốc của S3 bucket).
    *   *Tiếp theo:* Tạo ACM Certificate ở N. Virginia và tạo cấu hình **CloudFront Distribution** trỏ về S3 Bucket này qua OAC.

---

## ⬜ BƯỚC 4: Triển khai Data Layer (Aurora, Redis, DynamoDB)
*   **Trạng thái:** Chưa thực hiện.

---

## ⬜ BƯỚC 5: Triển khai Backend API (ALB, ASG, Secrets Manager)
*   **Trạng thái:** Chưa thực hiện.

---

## ⬜ BƯỚC 6: Thiết lập Async Layer & Worker (SQS, EventBridge)
*   **Trạng thái:** Chưa thực hiện.

---

## ⬜ BƯỚC 7: Cấu hình Bảo mật Edge & WAF (Cloudflare WAF)
*   **Trạng thái:** Chưa thực hiện.

---

## ⬜ BƯỚC 8: Cấu hình & Build Mobile App Production
*   **Trạng thái:** Chưa thực hiện.

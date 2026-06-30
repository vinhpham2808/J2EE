# PHẦN 5: WORKSHOP — ĐẢM BẢO TRUY CẬP HYBRID AN TOÀN ĐẾN AMAZON S3 BẰNG CÁCH SỬ DỤNG VPC ENDPOINT

> **Dự án tích hợp:** Money Manager (Quản lý tài chính cá nhân)
> **Ứng dụng thực tế:** Lưu trữ ảnh hóa đơn phục vụ AI OCR và kết xuất báo cáo tài chính.
> **Tài liệu hướng dẫn thực hành (Lab Step-by-Step) - Phiên bản không chứa Code lập trình & Cấu hình JSON**

---

## 5.1. TỔNG QUAN VỀ WORKSHOP (OVERVIEW)

### 5.1.1. Bối cảnh bài toán trong dự án Money Manager
Trong hệ thống quản lý tài chính **Money Manager**, người dùng tải lên hình ảnh hóa đơn từ thiết bị di động hoặc ứng dụng web. Hình ảnh này được lưu trữ trong một Amazon S3 Bucket trước khi được xử lý bởi tính năng AI OCR (Gemini Vision) để trích xuất thông tin giao dịch tự động. Đồng thời, các báo cáo tài chính dạng Excel cũng được hệ thống backend Spring Boot xuất ra định kỳ và lưu trữ trên S3 để người dùng tải về qua URL bảo mật.

Theo kiến trúc chuẩn AWS, các máy chủ Backend Spring Boot chạy trên dịch vụ EC2 nằm trong **Private App Subnets** (không có IP công cộng và không định tuyến trực tiếp ra Internet) để đảm bảo an toàn. 

Tuy nhiên, dịch vụ Amazon S3 nằm ngoài VPC và mặc định sử dụng public endpoint. Việc kết nối từ EC2 trong Private Subnet đến S3 thông thường phải đi qua NAT Gateway, dẫn đến hai hạn chế lớn:
1. **Chi phí:** Lưu lượng truyền tải qua NAT Gateway phát sinh phí rất cao khi lượng ảnh hóa đơn lớn.
2. **Bảo mật:** Lưu lượng phải đi qua Internet công cộng, tăng rủi ro rò rỉ dữ liệu.

### 5.1.2. Giải pháp: AWS PrivateLink & VPC Endpoints
Để giải quyết triệt để vấn đề này, bài lab hướng dẫn cấu hình kết nối riêng tư (Private Connection) đến Amazon S3 cho 2 trường hợp:
1. **Truy cập từ VPC (Cloud):** Sử dụng **Gateway VPC Endpoint**. Giải pháp này miễn phí, hoạt động thông qua việc cập nhật bảng định tuyến (Route Table) của VPC để chuyển hướng traffic đến S3 một cách nội bộ.
2. **Truy cập từ TTDL On-Premises (Hybrid):** Sử dụng **Interface VPC Endpoint** kết hợp **Route 53 Inbound Resolver**. Do Gateway VPC Endpoint không thể truy cập từ môi trường bên ngoài VPC (như máy trạm của lập trình viên mobile kết nối qua VPN/Direct Connect), Interface VPC Endpoint cung cấp các IP nội bộ (Private IP) để giải quyết bài toán này.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                 AWS VPC                                                │
│                                                                                                        │
│   ┌──────────────────────── Private Subnet ────────────────────────┐                                   │
│   │                                                                │                                   │
│   │   ┌───────────────────────┐                                    │                                   │
│   │   │  Money Manager App    ├───────────────────┐                │                                   │
│   │   │  (Spring Boot EC2)    │                   │                │                                   │
│   │   └───────────┬───────────┘                   │                │                                   │
│   └───────────────┼───────────────────────────────┼────────────────┘                                   │
│                   │ (Traffic nội bộ)              │ (Traffic nội bộ)                                   │
│                   ▼                               ▼                                                    │
│           ┌───────────────┐               ┌───────────────┐                                            │
│           │  Gateway End. │               │  Interface E. │                                            │
│           │   (vpce-s3)   │               │ (vpce-s3-int) │                                            │
│           └───────┬───────┘               └───────┬───────┘                                            │
└───────────────────┼───────────────────────────────┼────────────────────────────────────────────────────┘
                    │                               ▲
                    ▼                               │ (Kết nối qua VPN / Direct Connect)
            ┌───────────────┐                       │
            │   Amazon S3   │               ┌───────┴───────┐
            │  (MM Bucket)  │               │  On-Premises  │
            └───────────────┘               │ (Mobile Devs) │
                                            └───────────────┘
```

---

## 5.2. CHUẨN BỊ (PREREQUISITES)

### 5.2.1. Tài nguyên cần có trên AWS
1. **VPC:** 01 VPC có dải IP `10.0.0.0/16`.
2. **Subnets:**
   * `Public-Subnet-A` (`10.0.1.0/24`) liên kết với Internet Gateway (IGW).
   * `Private-Subnet-A` (`10.0.2.0/24`) làm nơi đặt máy chủ EC2 Backend.
3. **EC2 Instances:**
   * `EC2-Backend-App`: Đặt tại `Private-Subnet-A`, dùng để chạy Backend Spring Boot. Không gán Public IP.
   * `EC2-OnPremises-Simulator`: Đặt tại một mạng giả lập khác (hoặc Public Subnet) để đóng vai trò làm máy trạm On-premises kết nối vào qua VPN.
4. **S3 Bucket:** Đặt tên `moneymanager-receipts-secure-prod` (Thay thế tên bucket duy nhất của bạn).
5. **IAM Role:** Một IAM Role gán vào máy chủ `EC2-Backend-App` có quyền truy cập S3.

---

## 5.3. TRUY CẬP ĐẾN S3 TỪ VPC (Sử dụng Gateway VPC Endpoint)

### 5.3.1. Tạo Gateway VPC Endpoint cho S3
1. Truy cập AWS Management Console, chuyển đến dịch vụ **VPC**.
2. Tại menu bên trái, chọn **Endpoints** → Click **Create endpoint**.
3. **Name tag:** `vpce-s3-gateway-moneymanager`.
4. **Service category:** Chọn **AWS services**.
5. **Service name:** Tìm kiếm `s3` và chọn dịch vụ có Type là `Gateway` (Ví dụ: `com.amazonaws.ap-southeast-1.s3`).
6. **VPC:** Chọn VPC mà bạn đã chuẩn bị.
7. **Route tables:** Chọn Route Table đang liên kết với `Private-Subnet-A` (Nơi đặt ứng dụng Backend). Thao tác này sẽ tự động thêm một Route trỏ đến S3 thông qua Endpoint.
8. **Policy:** Chọn **Full access** (Để cấu hình phân quyền, ta sẽ dùng IAM hoặc Bucket Policy ở phần sau).
9. Click **Create endpoint**.

### 5.3.2. Kiểm tra Gateway VPC Endpoint
1. Sử dụng **AWS Systems Manager Session Manager** (hoặc Bastion host) để kết nối (SSH) vào máy chủ `EC2-Backend-App` nằm trong Private Subnet.
2. Kiểm tra bảng định tuyến hiện tại của máy chủ. Bạn sẽ thấy một bản ghi định tuyến tự động được thêm vào dạng trỏ đến danh sách dải IP của S3 qua target là Endpoint ID.
3. Sử dụng AWS CLI trên máy chủ EC2 để upload thử một file ảnh hóa đơn lên S3:
   ```bash
   # Tạo file ảnh giả lập hóa đơn
   echo "fake-receipt-data" > receipt_001.jpg

   # Upload lên bucket
   aws s3 cp receipt_001.jpg s3://moneymanager-receipts-secure-prod/userData/intern_test/
   ```
4. Xác minh đường truyền: Sử dụng công cụ `nslookup` để kiểm tra phân giải IP của bucket:
   ```bash
   nslookup moneymanager-receipts-secure-prod.s3.ap-southeast-1.amazonaws.com
   ```
   *Kết quả phân giải sẽ trả về các IP công cộng của AWS S3, tuy nhiên luồng dữ liệu thực tế đã được chuyển hướng ngay từ bảng định tuyến của hệ điều hành VPC sang Endpoint Gateway mà không hề đi qua NAT Gateway hay Internet Gateway.*

---

## 5.4. TRUY CẬP ĐẾN S3 TỪ MÔI TRƯỜNG TRUYỀN THỐNG (Sử dụng Interface VPC Endpoint)

Do thiết kế của AWS, các **Gateway Endpoint** không thể tiếp nhận lưu lượng truy cập đi qua kết nối VPN hoặc AWS Direct Connect từ văn phòng On-premises. Do đó, các nhà phát triển ứng dụng di động (Mobile App) tại văn phòng không thể gọi trực tiếp đến S3 để test tính năng tải hóa đơn nếu không mở S3 ra Internet công cộng. Giải pháp ở đây là cấu hình **Interface VPC Endpoint**.

### 5.4.1. Chuẩn bị tài nguyên
1. Giả lập một kết nối VPN nội bộ từ máy trạm `EC2-OnPremises-Simulator` đến VPC của AWS (Trong bài lab này, ta có thể mô phỏng bằng cách chạy lệnh từ một VPC được Peering với VPC chính).
2. Tạo một Security Group cho Endpoint:
   * Tên: `sg-s3-interface-endpoint`.
   * **Inbound Rules:** Cho phép cổng `443` (HTTPS) từ dải IP nội bộ của văn phòng On-premises (Ví dụ: `192.168.1.0/24` hoặc IP của máy giả lập `10.1.0.0/16`).

### 5.4.2. Tạo S3 Interface VPC Endpoint
1. Tại dịch vụ **VPC** → **Endpoints** → Click **Create endpoint**.
2. **Name tag:** `vpce-s3-interface-moneymanager`.
3. **Service category:** Chọn **AWS services**.
4. **Service name:** Nhập `s3` và chọn dịch vụ có Type là **Interface** (Ví dụ: `com.amazonaws.ap-southeast-1.s3`).
5. **VPC:** Chọn VPC của bạn.
6. **Subnets:** Chọn Private Subnet mà bạn muốn gán IP nội bộ cho Endpoint (Chọn ít nhất 2 Subnets ở 2 AZs khác nhau để đảm bảo High Availability).
7. **Security groups:** Chọn `sg-s3-interface-endpoint` vừa tạo ở bước 5.4.1.
8. **Policy:** Chọn **Full access**.
9. Click **Create endpoint**.

### 5.4.3. Kiểm tra Interface Endpoint từ máy trạm On-premises
Khi Interface Endpoint được tạo xong, AWS sẽ cung cấp các DNS nội bộ đặc thù cho Endpoint.
1. Đăng nhập vào máy trạm giả lập On-premises (`EC2-OnPremises-Simulator`).
2. Lấy thông tin DNS của Interface Endpoint tại tab **Details** trên AWS Console (Có định dạng tương tự như: `vpce-xxxx-ap-southeast-1.vpcs3.amazonaws.com`).
3. Sử dụng AWS CLI để upload ảnh hóa đơn từ máy trạm, cấu hình tham số `--endpoint-url` trỏ về Interface Endpoint:
   ```bash
   # Upload hóa đơn test từ văn phòng On-premises thông qua VPN & Interface Endpoint
   aws s3 --endpoint-url https://bucket.vpce-s3-interface-moneymanager.s3.ap-southeast-1.vpce.amazonaws.com cp onprem_receipt.jpg s3://moneymanager-receipts-secure-prod/userData/onprem_test/
   ```
4. Kiểm tra trên S3 Bucket để chắc chắn file `onprem_receipt.jpg` đã được upload thành công.

### 5.4.4. Mô phỏng On-premises DNS (Sử dụng Route 53 Inbound Resolver)
Để mã nguồn ứng dụng hoặc các script kiểm thử không phải thay đổi cấu hình Endpoint URL thủ công, chúng ta cấu hình DNS tự động phân giải URL S3 tiêu chuẩn về IP nội bộ của Interface Endpoint.

1. Truy cập dịch vụ **Route 53** → **Resolver** → **Inbound endpoints** → Chọn **Create inbound endpoint**.
2. **VPC:** Chọn VPC chạy hệ thống chính.
3. **IP addresses:** Chọn 2 Private Subnets tương ứng với 2 AZs để đặt các IP Resolver.
4. Tại máy trạm On-premises, cấu hình DNS forwarder để chuyển hướng mọi truy vấn đến miền `*.s3.ap-southeast-1.amazonaws.com` về các IP Resolver vừa tạo.
5. Kiểm thử bằng cách chạy lệnh AWS CLI tiêu chuẩn (Không cần truyền `--endpoint-url`):
   ```bash
   # Máy trạm tự động phân giải qua DNS Resolver nội bộ
   aws s3 cp test_dns_receipt.jpg s3://moneymanager-receipts-secure-prod/userData/dns_test/
   ```

---

## 5.5. VPC ENDPOINT POLICIES (LÀM THÊM / NÂNG CAO)

Để thắt chặt bảo mật tối đa theo chuẩn doanh nghiệp, tránh trường hợp kẻ tấn công chiếm quyền máy chủ EC2 rồi tải dữ liệu lên các tài khoản S3 cá nhân bên ngoài, ta cấu hình Endpoint Policy để giới hạn truy cập.

### 5.5.1. Cấu hình VPC Endpoint Policy
1. Chọn Endpoint `vpce-s3-gateway-moneymanager`.
2. Chọn tab **Policy** → Click **Edit policy**.
3. Cấu hình chính sách bảo mật cho phép máy chủ thực hiện các hành động cơ bản như lấy tệp tin (`GetObject`), lưu tệp tin (`PutObject`) và liệt kê thư mục (`ListBucket`) nhưng chỉ áp dụng trên tài nguyên S3 Bucket chỉ định (`arn:aws:s3:::moneymanager-receipts-secure-prod` và các thư mục con của nó). Tất cả các yêu cầu gửi đến các bucket khác từ VPC đều sẽ bị chặn.

### 5.5.2. Cấu hình S3 Bucket Policy ngăn chặn rò rỉ dữ liệu
Cấu hình chính sách từ chối trên S3 Bucket (Deny Bucket Policy) đối với tất cả các kết nối từ bên ngoài nếu yêu cầu đó không xuất phát từ ID của VPC Gateway Endpoint hoặc VPC Interface Endpoint của hệ thống. Điều này ngăn chặn việc tải dữ liệu từ internet công cộng hoặc từ VPC lạ bên ngoài.

---

## 5.6. DỌN DẸP TÀI NGUYÊN (CLEAN UP)

Sau khi hoàn thành bài thực hành, bạn cần thực hiện dọn dẹp các tài nguyên sau để tránh phát sinh chi phí:

1. **Xóa dữ liệu và S3 Bucket:**
   ```bash
   aws s3 rm s3://moneymanager-receipts-secure-prod --recursive
   aws s3api delete-bucket --bucket moneymanager-receipts-secure-prod --region ap-southeast-1
   ```
2. **Xóa các VPC Endpoints:**
   * Chọn `vpce-s3-gateway-moneymanager` → Click **Actions** → **Delete VPC endpoints**.
   * Chọn `vpce-s3-interface-moneymanager` → Click **Actions** → **Delete VPC endpoints**.
3. **Xóa Route 53 Resolver:**
   * Chọn Inbound Resolver vừa tạo → Click **Delete**.
4. **Xóa máy chủ EC2 và giải phóng tài nguyên mạng:**
   * Terminate 2 máy chủ `EC2-Backend-App` và `EC2-OnPremises-Simulator`.

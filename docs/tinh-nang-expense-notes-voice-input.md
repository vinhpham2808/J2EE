# Tính năng: Expense Notes & Voice Input (Ghi Chú & Nhập Liệu Bằng Giọng Nói)

> **Thông điệp:** *"Ghi nhớ chi tiêu như kể chuyện — ứng dụng sẽ hiểu"*

---

## 1. Tổng quan

Tính năng này cho phép người dùng **ghi chú chi tiết** khi thêm khoản chi tiêu (thay vì chỉ ghi tên ngắn gọn), đồng thời hỗ trợ **nhập liệu bằng giọng nói (voice-to-text)** thông qua Web Speech API / React Native voice libraries. Mục tiêu là tạo trải nghiệm nhập liệu tự nhiên, thân thiện và giàu dữ liệu để phục vụ AI coach phân tích chi tiêu sau này.

---

## 2. Kiến trúc đề xuất

```
[Mobile App]
    │
    ├── VoiceInputButton (Component) ─── Speech-to-Text engine
    │         │
    │         └──→ ExpenseNoteField (TextInput + Mic icon)
    │
    ├── SmartNoteParser (Utility)
    │         │
    │         ├── Parse số tiền từ giọng nói
    │         ├── Parse "chia với vợ/chồng/bạn" → split expense
    │         └── Extract keywords → gợi ý category
    │
    └── [API] ──→ Backend ──→ Lưu note vào DB
                        │
                        └── Search notes (keyword search)
```

---

## 3. Thay đổi phía Backend (Spring Boot)

### 3.1. Thêm trường `note` vào `ExpenseEntity`

```java
@Column(columnDefinition = "TEXT")
private String note;
```

### 3.2. Cập nhật DTOs

| DTO | Thay đổi |
|-----|----------|
| `ExpenseDTO` | Thêm `String note` |
| `ExpenseResponseDTO` | Thêm `String note` |
| `IncomeDTO` | Thêm `String note` (nếu muốn mở rộng cho income) |
| `IncomeResponseDTO` | Thêm `String note` |

### 3.3. Cập nhật Service / Mapper

- `ExpenseService.toEntity()`, `toDTO()`, `toResponseDTO()` → map field `note`
- Tương tự cho `IncomeService` nếu mở rộng

### 3.4. API tìm kiếm theo ghi chú

Cần thêm endpoint hoặc mở rộng endpoint hiện tại:

```
GET /expenses?q={keyword}
GET /expenses?note={keyword}
```

Backend thực hiện:

```java
@Query("SELECT e FROM ExpenseEntity e WHERE LOWER(e.note) LIKE LOWER(CONCAT('%', :keyword, '%'))")
List<ExpenseEntity> searchByNote(@Param("keyword") String keyword);
```

### 3.5. Migration Database

```sql
ALTER TABLE tbl_expenses ADD COLUMN note TEXT;
ALTER TABLE tbl_incomes ADD COLUMN note TEXT;  -- optional
```

---

## 4. Thay đổi phía Mobile (React Native / Expo)

### 4.1. Component mới: `VoiceInputButton`

**File:** `Mobile/src/components/VoiceInputButton.jsx`

Một nút microphone xuất hiện cạnh TextInput ghi chú.

```jsx
<VoiceInputButton onResult={(text) => setNote(text)} />
```

**Cơ chế hoạt động:**

| Nền tảng | Giải pháp |
|----------|-----------|
| iOS | `expo-speech-recognition` hoặc `react-native-speech-iflytek` |
| Android | `expo-speech-recognition` (SpeechRecognizer API) |
| Web (dev) | Web Speech API (`webkitSpeechRecognition`) |

> **Khuyến nghị:** Dùng thư viện `@react-native-voice/voice` (phiên bản React Native 0.79+ / Expo 53) hoặc `expo-speech-recognition` nếu có sẵn.

### 4.2. Component mới: `ExpenseNoteField`

**File:** `Mobile/src/components/ExpenseNoteField.jsx`

Kết hợp TextInput + VoiceInputButton:

```
┌──────────────────────────────────────┐
│  📝 Ghi chú chi tiết                  │
│ ┌──────────────────────────────────┐  │
│ │ Mua quần áo cho con gái...    🎤 │  │
│ └──────────────────────────────────┘  │
│                                       │
│ 🔹 "chia với vợ" → tính năng split   │
└──────────────────────────────────────┘
```

### 4.3. Component mới: `SmartNoteParser` (Utility)

**File:** `Mobile/src/utils/smartNoteParser.js`

Chức năng: Phân tích câu nói/ghi chú tự nhiên để trích xuất thông tin.

**Ví dụ input → output:**

| Câu nói | Chi tiêu chính | Ghi chú | Split |
|---------|----------------|---------|-------|
| "Chi 200K mua quần áo cho con gái" | 200,000 VND | Mua quần áo cho con gái | — |
| "500K tiền ăn tối với đồng nghiệp" | 500,000 VND | Tiền ăn tối với đồng nghiệp | — |
| "Chi 200K mua quần áo cho con gái, chia với vợ" | 100,000 VND (mình) + 100,000 VND (vợ) | Mua quần áo cho con gái | 50% vợ |
| "1 triệu tiền xăng xe, chia đều cho 3 đứa" | ~333,333 VND/người | Tiền xăng xe | 3 người |
| "Mua sắm 300K, Tuấn 150K, Lan 150K" | 150,000 VND (mình) | Mua sắm | Tuấn, Lan |
| "Đi siêu thị hết 800K chia 2" | 400,000 VND | Đi siêu thị | 50% |

**Logic xử lý:**
1. Dùng regex nhận diện mẫu câu tiếng Việt:
   - `chia với <ai>` → split 50-50 với người đó
   - `chia đều cho <n> người` → split đều
   - `<tên> <số tiền>` → split theo số tiền cụ thể
2. Trích xuất số tiền từ câu (`(\d+)\s*(K|k|ngàn|triệu|tr)`)
3. Phần còn lại làm `note`

### 4.4. Sửa đổi `AddExpenseScreen.js`

**Thay đổi:**
- Thêm trường `note` (TextInput + VoiceInputButton)
- Gửi `note` trong payload khi tạo expense
- Tích hợp `SmartNoteParser` để tự động parse và điền các trường

```jsx
// Payload gửi lên
{
  name: normalizedName,
  amount: numericAmount,
  categoryId: Number(categoryId),
  date,
  icon: "💸",
  note: noteText          // ← THÊM
}
```

### 4.5. Sửa đổi `ExpenseScreen.js` (Danh sách chi tiêu)

- Hiển thị icon 📝 hoặc text nhỏ `note` khi hover/tap
- Mở rộng item card:

```
┌─────────────────────────────────┐
│  👕 Mua quần áo cho con gái     │
│  12/05/2026 • Mua sắm           │
│  - 200,000 VND                  │
│  📝 Ghi chú: Chia với vợ        │  ← NEW
└─────────────────────────────────┘
```

### 4.6. Tìm kiếm theo keyword

- Thêm search bar ở đầu `ExpenseScreen.js`
- Gọi `GET /expenses?q={keyword}`
- Highlight keyword trong kết quả

### 4.7. Cập nhật `ExpenseItem` trong các component

- `TransactionInfoCard.jsx` (nếu được dùng)
- `RecentTransactions.jsx`
- `ExpenseList.jsx`

---

## 5. Giao diện người dùng (UI Mock)

### 5.1. Màn hình thêm chi tiêu (AddExpense)

```
┌──────────────────────────────┐
│  ← Thêm khoản chi             │
│                              │
│  Tên khoản chi               │
│  ┌────────────────────────┐  │
│  │ Mua quần áo            │  │
│  └────────────────────────┘  │
│                              │
│  📝 Ghi chú chi tiết         │
│  ┌──────────────────────┬──┐ │
│  │ Mua quần áo cho con  │🎤│ │
│  │ gái, chia với vợ     │  │ │
│  └──────────────────────┴──┘ │
│                              │
│  🔍 Phát hiện: Chia với vợ  │
│     → 100K (bạn) + 100K (vợ)│
│                              │
│  Số tiền                     │
│  ┌────────────────────────┐  │
│  │ 200.000                │  │
│  └────────────────────────┘  │
│                              │
│  Ngày                        │
│  ┌────────────────────────┐  │
│  │ 12/05/2026             │  │
│  └────────────────────────┘  │
│                              │
│  Danh mục                    │
│  ┌──────┐ ┌──────┐ ┌──────┐ │
│  │ Mặc  │ │ Ăn   │ │Di ch.│ │
│  │ đẹp  │ │ uống │ │      │ │
│  └──────┘ └──────┘ └──────┘ │
│                              │
│  ┌────────────────────────┐  │
│  │     Lưu chi tiêu       │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

### 5.2. Voice Input Modal

```
┌──────────────────────────────┐
│                              │
│         🎤                   │
│    Đang nghe...              │
│                              │
│  ┌────────────────────────┐  │
│  │ "Chi 200K mua quần áo  │  │
│  │  cho con gái"          │  │
│  └────────────────────────┘  │
│                              │
│  [Hủy]           [Xong]     │
└──────────────────────────────┘
```

### 5.3. Màn hình danh sách chi tiêu (ExpenseScreen) với Search

```
┌──────────────────────────────┐
│  🔍 Tìm kiếm ghi chú...      │
│                              │
│  ┌─────────────────────────┐ │
│  │ 👕 Mua quần áo cho con  │ │
│  │  gái                    │ │
│  │  📝 Chia với vợ         │ │ ← note hiển thị
│  │  - 200,000 • 12/05      │ │
│  └─────────────────────────┘ │
│                              │
│  ┌─────────────────────────┐ │
│  │ 🍕 Tiền ăn tối          │ │
│  │  📝 Với đồng nghiệp     │ │
│  │  - 500,000 • 11/05      │ │
│  └─────────────────────────┘ │
└──────────────────────────────┘
```

---

## 6. Luồng xử lý chi tiết

### 6.1. Luồng thêm expense với voice input

```
User bấm 🎤
    → Modal mic xuất hiện
    → User nói: "Chi 200K mua quần áo cho con gái, chia với vợ"
    → Speech-to-text chuyển thành text
    → SmartNoteParser phân tích:
        - amount: 200,000
        - note: "Mua quần áo cho con gái, chia với vợ"
        - split: 50% vợ (100K)
    → Tự động điền amount + note vào form
    → Hiển thị thông báo split expense
    → User xác nhận → gửi lên backend
```

### 6.2. Luồng tìm kiếm

```
User gõ "quần áo" vào search bar
    → GET /expenses?q=quần áo
    → Backend query WHERE note LIKE '%quần áo%'
    → Trả về danh sách matching
    → Highlight keyword trong kết quả
```

---

## 7. Smart Note Parser — Chi tiết kỹ thuật

### 7.1. Regex patterns cho tiếng Việt

```javascript
const PATTERNS = {
  // "200K", "200k", "200 ngàn", "2 triệu", "2tr"
  amount: /(\d+[.,]?\d*)\s*(K|k|ngàn|nghìn|triệu|tr|trieu)/g,
  
  // "chia với vợ", "chia cho mẹ", "cùng với Tuấn"
  splitWith: /(?:chia|cùng)\s+(?:với|cho)\s+(\S+)/gi,
  
  // "chia đều cho 3 người", "chia 3"
  splitEqual: /chia\s*(?:đều)?\s*(?:cho)?\s*(\d+)\s*(?:người|đứa|phần)?/gi,
  
  // "Tuấn 150K, Lan 150K"
  namedSplit: /(\S+)\s+(\d+[.,]?\d*\s*(?:K|k|ngàn|triệu|tr))/gi,
  
  // "chia 2", "chia 50-50"
  splitHalf: /chia\s*(?:2|hai|đôi|rưỡi|50\s*-\s*50)/gi
};
```

### 7.2. Xử lý amount viết tắt

| Input | Parsed |
|-------|--------|
| `200K` | 200,000 |
| `2 triệu` | 2,000,000 |
| `1.5tr` | 1,500,000 |
| `500 ngàn` | 500,000 |
| `3,5 triệu` | 3,500,000 |

### 7.3. Split logic

```javascript
function parseSplitExpense(text, totalAmount) {
  // Case 1: "chia đều cho 3 người" → totalAmount / 3
  // Case 2: "chia với vợ" → totalAmount / 2
  // Case 3: "Tuấn 150K, Lan 150K" → specific amounts
  // Case 4: "chia 2" → totalAmount / 2
  
  return {
    myShare: number,       // phần của mình
    splits: [              // các phần chia
      { person: "vợ", amount: 100000 },
      { person: "Tuấn", amount: 150000 }
    ],
    note: string           // phần còn lại làm ghi chú
  };
}
```

---

## 8. Các gói npm cần thêm

| Package | Mục đích | Lý do |
|---------|----------|-------|
| `@react-native-voice/voice` | Speech-to-text | Phổ biến, active maintenance |
| hoặc `react-native-speech-recognition` | Speech-to-text | Alternative |

> **Note:** Vì dùng Expo 53 (dev client), cần chọn package hỗ trợ react-native 0.79+. Có thể cần dùng config plugin cho Expo.

---

## 9. Files cần tạo / sửa đổi

### Tạo mới
| File | Mô tả |
|------|-------|
| `Mobile/src/components/VoiceInputButton.jsx` | Nút mic + modal voice input |
| `Mobile/src/components/ExpenseNoteField.jsx` | TextInput + mic cho note |
| `Mobile/src/utils/smartNoteParser.js` | Parse ghi chú tự nhiên |
| `Backend/.../dto/request/ExpenseSearchRequest.java` | DTO cho search query |

### Sửa đổi
| File | Thay đổi |
|------|----------|
| `Mobile/src/screens/AddExpenseScreen.js` | Thêm note field + voice input |
| `Mobile/src/screens/AddIncomeScreen.js` | (Optional) Thêm note field |
| `Mobile/src/screens/ExpenseScreen.js` | Thêm search bar + hiển thị note |
| `Mobile/src/components/ExpenseList.jsx` | Hiển thị note trong item |
| `Mobile/src/components/TransactionInfoCard.jsx` | Hiển thị note |
| `Mobile/src/components/RecentTransactions.jsx` | Hiển thị note |
| `Mobile/src/services/http.js` | Thêm params search (nếu cần) |
| `Backend/.../entity/ExpenseEntity.java` | Thêm field `note` |
| `Backend/.../dto/ExpenseDTO.java` | Thêm field `note` |
| `Backend/.../dto/ExpenseResponseDTO.java` | Thêm field `note` |
| `Backend/.../service/ExpenseService.java` | Map note field + search logic |
| `Backend/.../controller/ExpenseController.java` | Thêm search param |
| `Backend/.../repository/ExpenseRepository.java` | Thêm query search note |

---

## 10. Rủi ro & Giải pháp

| Rủi ro | Giải pháp |
|--------|-----------|
| Speech recognition không chính xác với tiếng Việt | Dùng Google Speech-to-Text API làm fallback; cho user sửa text thủ công |
| Permission microphone trên iOS | Thêm `NSMicrophoneUsageDescription` vào Info.plist |
| Permission microphone trên Android | Thêm `RECORD_AUDIO` permission |
| Expo managed workflow limitations | Dùng development build (đã có `expo-dev-client`) |
| Performance khi parse text dài | Giới hạn note length (500 ký tự); parse client-side đơn giản |
| Người dùng nói tiếng địa phương | Không xử lý đặc biệt; dùng text user sửa lại làm dữ liệu gốc |

---

## 11. Kế hoạch triển khai

### Phase 1 — Core (3-4 ngày)
1. Backend: Thêm `note` field vào Expense entity, DTO, service, repository
2. Backend: Migration DB
3. Mobile: `ExpenseNoteField` component (TextInput + mic button)
4. Mobile: Gửi `note` trong payload AddExpense

### Phase 2 — Voice Input (2-3 ngày)
1. Mobile: Cài đặt `@react-native-voice/voice`
2. Mobile: `VoiceInputButton` component
3. Mobile: Voice input modal UI
4. Mobile: Xử lý permission microphone

### Phase 3 — Smart Parsing (2-3 ngày)
1. Mobile: `smartNoteParser.js` — amount extraction
2. Mobile: Split expense parsing
3. Mobile: Category suggestion từ note keywords

### Phase 4 — Search (2 ngày)
1. Backend: Search endpoint `GET /expenses?q=`
2. Mobile: Search bar trong ExpenseScreen
3. Mobile: Highlight keyword trong kết quả

### Phase 5 — Polish (1-2 ngày)
1. Hiển thị note trong TransactionInfoCard, RecentTransactions
2. Test các edge cases
3. Localization tiếng Việt hoàn chỉnh

---

## 12. Mở rộng tương lai

- **AI Coach phân tích note**: Dùng note để hiểu ngữ cảnh chi tiêu, đưa ra lời khuyên
- **Auto-categorize từ note**: "Ăn uống" → tự chọn category "Ăn uống"
- **Note cho income**: Mở rộng cho cả thu nhập
- **Voice search**: "Tìm các khoản chi mua quần áo" → tìm kiếm bằng giọng nói
- **Multi-language**: Hỗ trợ thêm tiếng Anh cho SmartNoteParser
- **Export notes**: Khi export báo cáo, kèm theo ghi chú

---

*Tài liệu này được tạo ngày 12/05/2026*

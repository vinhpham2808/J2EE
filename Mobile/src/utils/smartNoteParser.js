/**
 * Smart Note Parser — Phân tích ghi chú chi tiêu bằng tiếng Việt
 *
 * Hỗ trợ:
 * - Trích xuất số tiền từ câu nói (200K, 2 triệu, 500 ngàn,...)
 * - Phát hiện chia tiền (chia với vợ, chia đều cho 3 người,...)
 * - Tách phần ghi chú còn lại
 */

const AMOUNT_PATTERN =
  /(\d+[.,]?\d*)\s*(K|k|ngàn|nghìn|triệu|tr|trieu|tỷ|tỉ|ty|ti)/g;

const SPLIT_WITH_PATTERN = /(?:chia|cùng)\s+(?:với|cho)\s+(\S+)/gi;

const SPLIT_EQUAL_PATTERN = /chia\s*(?:đều)?\s*(?:cho)?\s*(\d+)\s*(?:người|đứa|phần|đứa)/gi;

const SPLIT_HALF_PATTERN = /chia\s*(?:2|hai|đôi|rưỡi|50\s*[-\s]*50)/gi;

const NAMED_SPLIT_PATTERN = /(\S+)\s+(\d+[.,]?\d*\s*(?:K|k|ngàn|triệu|tr))/gi;

/**
 * Chuyển đổi số tiền viết tắt thành số
 * Ví dụ: "200K" → 200000, "2 triệu" → 2000000, "1.5tr" → 1500000
 */
export function parseAmountText(text) {
  const cleanText = text.replace(/,/g, "").replace(/\./g, ".");
  let total = 0;
  let lastIndex = 0;
  let match;

  const regex = new RegExp(AMOUNT_PATTERN.source, "g");
  while ((match = regex.exec(cleanText)) !== null) {
    const value = parseFloat(match[1].replace(",", "."));
    const unit = match[2].toLowerCase();
    let multiplier;

    switch (unit) {
      case "k":
        multiplier = 1000;
        break;
      case "ngàn":
      case "nghìn":
        multiplier = 1000;
        break;
      case "triệu":
      case "tr":
      case "trieu":
        multiplier = 1000000;
        break;
      case "tỷ":
      case "tỉ":
      case "ty":
      case "ti":
        multiplier = 1000000000;
        break;
      default:
        multiplier = 1;
    }

    total += value * multiplier;
    lastIndex = regex.lastIndex;
  }

  return { amount: total, lastIndex };
}

/**
 * Phát hiện và phân tích chia tiền (split expense)
 */
export function parseSplitExpense(text, totalAmount) {
  const splits = [];

  // Case 1: "chia đều cho 3 người"
  let match;
  const equalRegex = new RegExp(SPLIT_EQUAL_PATTERN.source, "gi");
  while ((match = equalRegex.exec(text)) !== null) {
    const numPeople = parseInt(match[1], 10);
    if (numPeople > 1 && totalAmount > 0) {
      const share = Math.floor(totalAmount / numPeople);
      splits.push({
        type: "equal",
        people: numPeople,
        share,
        label: `Chia đều cho ${numPeople} người (${(share).toLocaleString("vi-VN")}/người)`
      });
    }
    return {
      myShare: totalAmount - splits.reduce((sum, s) => sum + s.share * (s.people - 1), 0),
      splits,
      myShareLabel: `Phần của bạn: ${(totalAmount - splits.reduce((sum, s) => sum + s.share * (s.people - 1), 0)).toLocaleString("vi-VN")}`
    };
  }

  // Case 2: "chia 2" or "chia hai" or "chia 50-50"
  if (SPLIT_HALF_PATTERN.test(text)) {
    const half = Math.floor(totalAmount / 2);
    return {
      myShare: half,
      splits: [{ type: "half", people: 2, share: half, label: `Chia đôi — mỗi người ${half.toLocaleString("vi-VN")}` }],
      myShareLabel: `Phần của bạn: ${half.toLocaleString("vi-VN")}`
    };
  }

  // Case 3: "chia với vợ", "chia cho mẹ"
  const withRegex = new RegExp(SPLIT_WITH_PATTERN.source, "gi");
  while ((match = withRegex.exec(text)) !== null) {
    const person = match[1];
    const half = Math.floor(totalAmount / 2);
    splits.push({
      type: "with",
      person,
      share: half,
      label: `Chia với ${person} — mỗi người ${half.toLocaleString("vi-VN")}`
    });
    return {
      myShare: totalAmount - half,
      splits,
      myShareLabel: `Phần của bạn: ${(totalAmount - half).toLocaleString("vi-VN")}`
    };
  }

  // Case 4: "Tuấn 150K, Lan 150K"
  const namedRegex = new RegExp(NAMED_SPLIT_PATTERN.source, "gi");
  let namedSplits = [];
  let namedTotal = 0;
  while ((match = namedRegex.exec(text)) !== null) {
    const person = match[1];
    const amount = parseAmountText(match[2]).amount;
    namedSplits.push({ type: "named", person, share: amount, label: `${person}: ${amount.toLocaleString("vi-VN")}` });
    namedTotal += amount;
  }

  if (namedSplits.length > 0) {
    return {
      myShare: totalAmount - namedTotal,
      splits: namedSplits,
      myShareLabel: `Phần của bạn: ${(totalAmount - namedTotal).toLocaleString("vi-VN")}`
    };
  }

  // No split detected
  return {
    myShare: totalAmount,
    splits: [],
    myShareLabel: null
  };
}

/**
 * Phân tích toàn bộ câu nói/ghi chú
 * Trả về: { amount, note, splitInfo }
 */
export function parseNote(text) {
  if (!text || !text.trim()) {
    return { amount: 0, note: "", splitInfo: null };
  }

  const trimmed = text.trim();

  // Bỏ từ "chi" hoặc "thu" đầu câu nếu có
  const normalized = trimmed.replace(/^(chi|thu|mua)\s+/i, "");

  // Trích xuất số tiền
  const { amount } = parseAmountText(normalized);

  // Phân tích split
  let splitInfo = null;
  if (amount > 0) {
    splitInfo = parseSplitExpense(normalized, amount);
  }

  // Xóa các pattern amount và split khỏi text để lấy note thuần
  let note = normalized
    .replace(AMOUNT_PATTERN, "")
    .replace(SPLIT_WITH_PATTERN, "")
    .replace(SPLIT_EQUAL_PATTERN, "")
    .replace(SPLIT_HALF_PATTERN, "")
    .replace(NAMED_SPLIT_PATTERN, "")
    .replace(/\s+/g, " ")
    .trim();

  // Nếu note rỗng thì dùng text gốc (đã bỏ "chi/thu")
  if (!note) {
    note = normalized;
  }

  return { amount, note, splitInfo };
}

/**
 * Gợi ý category từ nội dung ghi chú
 */
export function suggestCategory(note, categories = []) {
  if (!note || categories.length === 0) return null;

  const keywordMap = {
    "ăn uống": ["ăn", "uống", "nhậu", "cơm", "phở", "bún", "bánh", "trà sữa", "cafe", "cà phê", "tiệc", "lẩu", "nướng"],
    "mua sắm": ["mua", "sắm", "quần áo", "giày", "túi", "đồ", "shop", "siêu thị", "mall"],
    "di chuyển": ["xăng", "xe", "bus", "taxi", "grab", "be", "xem", "đi lại", "vé", "tàu", "máy bay"],
    "nhà ở": ["nhà", "thuê", "điện", "nước", "chung cư", "sửa", "sơn"],
    "sức khỏe": ["thuốc", "bệnh", "khám", "viện", "bệnh viện", "hiệu thuốc", "vitamin"],
    "giải trí": ["phim", "xem", "game", "netflix", "spotify", "hát", "karaoke", "du lịch"]
  };

  const lowerNote = note.toLowerCase();
  let bestCategory = null;
  let bestScore = 0;

  for (const category of categories) {
    const catName = (category.name || "").toLowerCase();
    const keywords = keywordMap[catName] || [];
    const score = keywords.filter((kw) => lowerNote.includes(kw)).length;

    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestScore > 0 ? bestCategory : null;
}

export default {
  parseAmountText,
  parseSplitExpense,
  parseNote,
  suggestCategory
};

import { parseAmountText, parseSplitExpense, parseNote, suggestCategory } from "../noteParser";

describe("parseAmountText", () => {
  test("parses '200K' as 200000", () => {
    expect(parseAmountText("200K").amount).toBe(200000);
  });

  test("parses '2 triệu' as 2000000", () => {
    expect(parseAmountText("2 triệu").amount).toBe(2000000);
  });

  test("parses '1.5tr' as 1500000", () => {
    expect(parseAmountText("1.5tr").amount).toBe(1500000);
  });

  test("parses '500 ngàn' as 500000", () => {
    expect(parseAmountText("500 ngàn").amount).toBe(500000);
  });

  test("parses '1 tỷ 200 triệu' as 1200000000", () => {
    const result = parseAmountText("1 tỷ 200 triệu");
    expect(result.amount).toBe(1200000000);
  });

  test("parses '10tr' as 10000000", () => {
    expect(parseAmountText("10tr").amount).toBe(10000000);
  });

  test("returns 0 when no amount present", () => {
    expect(parseAmountText("mua sữa").amount).toBe(0);
  });

  test("handles 'k' lowercase", () => {
    expect(parseAmountText("50k").amount).toBe(50000);
  });

  test("parses multiple amounts and sums them", () => {
    const result = parseAmountText("100K tiền xăng, 200K tiền ăn");
    expect(result.amount).toBe(300000);
  });
});

describe("parseSplitExpense", () => {
  test("detects 'chia đều cho 3 người'", () => {
    const result = parseSplitExpense("chia đều cho 3 người", 300000);
    expect(result.splits[0].type).toBe("equal");
    expect(result.splits[0].people).toBe(3);
    expect(result.myShare).toBe(100000);
  });

  test("detects 'chia 2' (half split)", () => {
    const result = parseSplitExpense("chia 2", 200000);
    expect(result.splits[0].type).toBe("half");
    expect(result.myShare).toBe(100000);
  });

  test("detects 'chia với vợ'", () => {
    const result = parseSplitExpense("chia với vợ", 200000);
    expect(result.splits[0].type).toBe("with");
    expect(result.splits[0].person).toBe("vợ");
    expect(result.myShare).toBe(100000);
  });

  test("detects named split 'Tuấn 150K'", () => {
    const result = parseSplitExpense("Tuấn 150K, Lan 150K", 400000);
    expect(result.splits[0].type).toBe("named");
    expect(result.myShare).toBe(100000);
  });

  test("returns full amount when no split detected", () => {
    const result = parseSplitExpense("mua sữa", 100000);
    expect(result.myShare).toBe(100000);
    expect(result.splits).toEqual([]);
    expect(result.myShareLabel).toBeNull();
  });
});

describe("parseNote", () => {
  test("parses full note with amount and split", () => {
    const result = parseNote("chi 200K tiền ăn chia đều cho 2 người");
    expect(result.amount).toBe(200000);
    expect(result.note).toMatch(/tiền ăn/i);
    expect(result.splitInfo).not.toBeNull();
    expect(result.splitInfo.splits.length).toBeGreaterThan(0);
  });

  test("parses note with 'mua' prefix", () => {
    const result = parseNote("mua sữa 100K");
    expect(result.amount).toBe(100000);
    expect(result.note).toMatch(/sữa/);
  });

  test("returns zero and empty note for empty input", () => {
    const result = parseNote("");
    expect(result.amount).toBe(0);
    expect(result.note).toBe("");
    expect(result.splitInfo).toBeNull();
  });

  test("returns zero and empty note for whitespace input", () => {
    const result = parseNote("   ");
    expect(result.amount).toBe(0);
    expect(result.note).toBe("");
    expect(result.splitInfo).toBeNull();
  });
});

describe("suggestCategory", () => {
  const categories = [
    { name: "ăn uống" },
    { name: "mua sắm" },
    { name: "di chuyển" },
    { name: "sức khỏe" },
  ];

  test("suggests 'ăn uống' for food-related note", () => {
    const result = suggestCategory("đi ăn lẩu với bạn", categories);
    expect(result).not.toBeNull();
    expect(result.name).toBe("ăn uống");
  });

  test("suggests 'di chuyển' for transport-related note", () => {
    const result = suggestCategory("đổ xăng xe máy", categories);
    expect(result).not.toBeNull();
    expect(result.name).toBe("di chuyển");
  });

  test("returns null when no keywords match", () => {
    const result = suggestCategory("linh tinh", categories);
    expect(result).toBeNull();
  });

  test("returns null for empty categories", () => {
    expect(suggestCategory("ăn uống", [])).toBeNull();
  });

  test("returns null for empty note", () => {
    expect(suggestCategory("", categories)).toBeNull();
  });
});

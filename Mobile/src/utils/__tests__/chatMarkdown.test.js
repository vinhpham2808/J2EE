const { parseChatMarkdown, parseInlineMarkdown, stripThinkBlocks } = require("../chatMarkdown");

describe("stripThinkBlocks", () => {
  test("removes <think>...</think> blocks", () => {
    expect(stripThinkBlocks("Hello <think>internal</think> world")).toBe("Hello  world");
  });

  test("removes unclosed <think> block to end of string", () => {
    expect(stripThinkBlocks("Hello <think>unfinished")).toBe("Hello");
  });

  test("returns empty string for only think block", () => {
    expect(stripThinkBlocks("<think>deep thoughts</think>")).toBe("");
  });

  test("handles empty input", () => {
    expect(stripThinkBlocks("")).toBe("");
  });
});

describe("parseInlineMarkdown", () => {
  test("parses bold text (**) into bold segments", () => {
    const segments = parseInlineMarkdown("This is **bold** text");
    expect(segments).toContainEqual({ text: "bold", type: "bold" });
  });

  test("parses inline code (`) into code segments", () => {
    const segments = parseInlineMarkdown("Run `npm test` now");
    expect(segments).toContainEqual({ text: "npm test", type: "code" });
  });

  test("returns single text segment for plain text", () => {
    const segments = parseInlineMarkdown("Hello world");
    expect(segments).toEqual([{ text: "Hello world", type: "text" }]);
  });

  test("handles mixed bold and code", () => {
    const segments = parseInlineMarkdown("**Warning**: use `--force`");
    expect(segments.length).toBeGreaterThanOrEqual(3);
  });
});

describe("parseChatMarkdown", () => {
  test("parses headings (# ## ###)", () => {
    const blocks = parseChatMarkdown("# Title\n## Subtitle\n### Subsub");
    expect(blocks[0].type).toBe("heading");
    expect(blocks[0].level).toBe(1);
    expect(blocks[1].type).toBe("heading");
    expect(blocks[1].level).toBe(2);
  });

  test("parses bullet lists", () => {
    const blocks = parseChatMarkdown("- item one\n- item two");
    expect(blocks[0].type).toBe("bulletList");
    expect(blocks[0].items).toHaveLength(2);
  });

  test("parses ordered lists", () => {
    const blocks = parseChatMarkdown("1. first\n2. second");
    expect(blocks[0].type).toBe("orderedList");
    expect(blocks[0].items).toHaveLength(2);
  });

  test("parses code blocks (```)", () => {
    const blocks = parseChatMarkdown("```\nconst x = 1;\n```");
    expect(blocks[0].type).toBe("codeBlock");
    expect(blocks[0].text).toContain("const x");
  });

  test("parses blockquotes", () => {
    const blocks = parseChatMarkdown("> quoted text");
    expect(blocks[0].type).toBe("quote");
  });

  test("parses paragraphs", () => {
    const blocks = parseChatMarkdown("First paragraph.\n\nSecond paragraph.");
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe("paragraph");
    expect(blocks[1].type).toBe("paragraph");
  });

  test("returns empty array for empty input", () => {
    expect(parseChatMarkdown("")).toEqual([]);
  });

  test("returns empty array for think-only input", () => {
    expect(parseChatMarkdown("<think>only thinking</think>")).toEqual([]);
  });
});

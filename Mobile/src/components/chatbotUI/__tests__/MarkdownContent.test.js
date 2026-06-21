import React from "react";
import { render } from "@testing-library/react-native";
import MarkdownContent from "../MarkdownContent";
import { parseChatMarkdown } from "../../../utils/chatMarkdown";

jest.mock("../../../utils/chatMarkdown", () => ({
  parseChatMarkdown: jest.fn(),
}));

describe("MarkdownContent", () => {
  const colors = {
    BG: "#FFFFFF",
    PRIMARY: "#EF5E83",
    TEXT: "#1A0F14",
    TEXT_SECONDARY: "#8B7B80",
    CARD_BORDER: "#E5E7EB",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns null if text translates to no blocks", () => {
    parseChatMarkdown.mockReturnValueOnce([]);
    const { toJSON } = render(
      <MarkdownContent colors={colors} isError={false} text="" />
    );
    expect(toJSON()).toBeNull();
  });

  test("renders headings correctly", () => {
    parseChatMarkdown.mockReturnValueOnce([
      {
        type: "heading",
        level: 1,
        segments: [{ type: "text", text: "Tiêu đề lớn" }],
      },
      {
        type: "heading",
        level: 2,
        segments: [{ type: "text", text: "Tiêu đề nhỏ" }],
      },
    ]);

    const { getByText } = render(
      <MarkdownContent colors={colors} isError={false} text="any" />
    );

    expect(getByText("Tiêu đề lớn")).toBeTruthy();
    expect(getByText("Tiêu đề nhỏ")).toBeTruthy();
  });

  test("renders bullet lists and ordered lists correctly", () => {
    parseChatMarkdown.mockReturnValueOnce([
      {
        type: "bulletList",
        items: [
          [{ type: "text", text: "Mục bullet 1" }],
          [{ type: "text", text: "Mục bullet 2" }],
        ],
      },
      {
        type: "orderedList",
        items: [
          [{ type: "text", text: "Mục order 1" }],
        ],
      },
    ]);

    const { getByText, getAllByText } = render(
      <MarkdownContent colors={colors} isError={false} text="any" />
    );

    expect(getAllByText("•")).toHaveLength(2);
    expect(getByText("Mục bullet 1")).toBeTruthy();
    expect(getByText("Mục bullet 2")).toBeTruthy();
    expect(getByText("1.")).toBeTruthy();
    expect(getByText("Mục order 1")).toBeTruthy();
  });

  test("renders quotes correctly", () => {
    parseChatMarkdown.mockReturnValueOnce([
      {
        type: "quote",
        segments: [{ type: "text", text: "Đây là một câu trích dẫn" }],
      },
    ]);

    const { getByText } = render(
      <MarkdownContent colors={colors} isError={false} text="any" />
    );

    expect(getByText("Đây là một câu trích dẫn")).toBeTruthy();
  });

  test("renders codeBlock correctly", () => {
    parseChatMarkdown.mockReturnValueOnce([
      {
        type: "codeBlock",
        text: "console.log('Hello');",
      },
    ]);

    const { getByText } = render(
      <MarkdownContent colors={colors} isError={false} text="any" />
    );

    expect(getByText("console.log('Hello');")).toBeTruthy();
  });

  test("renders paragraph with bold and inline code segments correctly", () => {
    parseChatMarkdown.mockReturnValueOnce([
      {
        type: "paragraph",
        segments: [
          { type: "text", text: "Chữ thường " },
          { type: "bold", text: "chữ đậm" },
          { type: "text", text: " và " },
          { type: "code", text: "const x = 1;" },
        ],
      },
    ]);

    const { getByText } = render(
      <MarkdownContent colors={colors} isError={false} text="any" />
    );

    expect(getByText("Chữ thường ")).toBeTruthy();
    expect(getByText("chữ đậm")).toBeTruthy();
    expect(getByText(" và ")).toBeTruthy();
    expect(getByText("const x = 1;")).toBeTruthy();
  });
});

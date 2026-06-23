import React from "react";
import { create, act } from "react-test-renderer";
import { Pressable, Text } from "react-native";
import JarSelector from "../JarSelector";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock("../../../constants/colors", () => ({
  useAppColors: () => ({
    TEXT: "#000",
    TEXT_SECONDARY: "#555",
    TEXT_MUTED: "#999",
    PRIMARY: "#EF5E83",
    BG: "#F5F5F5",
    CARD: "#FFF",
    CARD_BORDER: "#E0E0E0",
  }),
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (n) => n,
}));

const sampleJars = [
  { id: 1, name: "Necessities", icon: "🏠", color: "#4CAF50" },
  { id: 2, name: "Education", icon: "📚", color: "#2196F3" },
  { id: 3, name: "Play", icon: "🎮", color: "#FF9800" },
];

const baseProps = {
  jarId: "",
  jars: sampleJars,
  loading: false,
  onChange: jest.fn(),
};

describe("JarSelector", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders title label", () => {
    let root;
    act(() => {
      root = create(<JarSelector {...baseProps} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain("jarSelector.title");
  });

  it("shows loading text when loading=true", () => {
    let root;
    act(() => {
      root = create(<JarSelector {...baseProps} loading={true} jars={[]} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain("jarSelector.loading");
  });

  it("shows empty text when jars is empty and not loading", () => {
    let root;
    act(() => {
      root = create(<JarSelector {...baseProps} jars={[]} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain("jarSelector.empty");
  });

  it("renders a pressable item for each jar", () => {
    let root;
    act(() => {
      root = create(<JarSelector {...baseProps} />);
    });
    const pressables = root.root.findAllByType(Pressable);
    expect(pressables.length).toBe(sampleJars.length);
  });

  it("renders jar names", () => {
    let root;
    act(() => {
      root = create(<JarSelector {...baseProps} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain("Necessities");
    expect(texts).toContain("Education");
    expect(texts).toContain("Play");
  });

  it("renders jar icons (emoji)", () => {
    let root;
    act(() => {
      root = create(<JarSelector {...baseProps} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain("🏠");
    expect(texts).toContain("📚");
    expect(texts).toContain("🎮");
  });

  it("renders default emoji 🏺 when jar has no icon", () => {
    const jarsNoIcon = [{ id: 10, name: "No Icon Jar", color: "#888" }];
    let root;
    act(() => {
      root = create(<JarSelector {...baseProps} jars={jarsNoIcon} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain("🏺");
  });

  it("calls onChange with jar id when unselected jar is pressed", () => {
    const onChange = jest.fn();
    let root;
    act(() => {
      root = create(<JarSelector {...baseProps} onChange={onChange} jarId="" />);
    });
    act(() => {
      root.root.findAllByType(Pressable)[0].props.onPress();
    });
    expect(onChange).toHaveBeenCalledWith("1");
  });

  it("calls onChange with empty string when selected jar is pressed (deselect)", () => {
    const onChange = jest.fn();
    let root;
    act(() => {
      root = create(
        <JarSelector {...baseProps} onChange={onChange} jarId="2" />
      );
    });
    // Second jar (id=2) is currently selected — pressing it should deselect
    act(() => {
      root.root.findAllByType(Pressable)[1].props.onPress();
    });
    expect(onChange).toHaveBeenCalledWith("");
  });
});

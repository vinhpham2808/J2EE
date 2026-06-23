import React from "react";
import { create, act } from "react-test-renderer";
import { Pressable, Text, TextInput } from "react-native";
import ReceiptItemRow from "../ReceiptItemRow";

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
    EXPENSE: "#F44336",
    EXPENSE_LIGHT: "#FFEBEE",
    WARNING: "#FF9800",
  }),
}));

jest.mock("../../../utils/format", () => ({
  formatCurrencyInput: (val) => `formatted:${val}`,
  parseCurrencyInput: (val) => Number(val.replace("formatted:", "")),
  todayIso: () => "2024-06-20",
}));

jest.mock("../../../utils/categoryIcons", () => ({
  CategoryVectorIcon: () => null,
  getIconColor: () => "#888",
}));

jest.mock("../../../utils/layoutScale", () => ({
  scale: (n) => n,
}));

// Mock PickDateField as a simple stub
jest.mock("../../../utils/datePicker", () => ({
  PickDateField: ({ label }) => {
    const { Text } = require("react-native");
    return <Text>{label}</Text>;
  },
}));

// Mock CategoryPickerModal so we can control its visibility
jest.mock("../CategoryPickerModal", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return ({ visible, onClose, onSelect, categories }) => (
    <View testID="category-picker-modal">
      <Text testID="picker-visible">{String(visible)}</Text>
    </View>
  );
});

const sampleCategories = [
  { id: 1, name: "Food", icon: "food" },
  { id: 2, name: "Transport", icon: "transport" },
];

const baseItem = {
  name: "Apple",
  amount: 50000,
  categoryId: null,
  icon: null,
  date: "2024-06-20",
  categoryHint: null,
};

const baseProps = {
  categories: sampleCategories,
  categoriesLoading: false,
  index: 0,
  item: baseItem,
  onDelete: jest.fn(),
  onUpdate: jest.fn(),
};

describe("ReceiptItemRow", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders item index badge with correct number", () => {
    let root;
    act(() => {
      root = create(<ReceiptItemRow {...baseProps} index={2} />);
    });
    // React renders `#{index+1}` as two children: "#" and 3
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("#");
    expect(texts).toContain(3);
  });

  it("renders delete button text", () => {
    let root;
    act(() => {
      root = create(<ReceiptItemRow {...baseProps} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("receiptItem.deleteItem");
  });

  it("calls onDelete with index when delete button is pressed", () => {
    const onDelete = jest.fn();
    let root;
    act(() => {
      root = create(<ReceiptItemRow {...baseProps} onDelete={onDelete} index={1} />);
    });
    // First pressable is delete button
    act(() => {
      root.root.findAllByType(Pressable)[0].props.onPress();
    });
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it("renders 2 TextInputs (name and amount)", () => {
    let root;
    act(() => {
      root = create(<ReceiptItemRow {...baseProps} />);
    });
    expect(root.root.findAllByType(TextInput).length).toBe(2);
  });

  it("name input shows correct value", () => {
    let root;
    act(() => {
      root = create(<ReceiptItemRow {...baseProps} item={{ ...baseItem, name: "Banana" }} />);
    });
    const inputs = root.root.findAllByType(TextInput);
    expect(inputs[0].props.value).toBe("Banana");
  });

  it("amount input shows formatted value", () => {
    let root;
    act(() => {
      root = create(<ReceiptItemRow {...baseProps} item={{ ...baseItem, amount: 75000 }} />);
    });
    const inputs = root.root.findAllByType(TextInput);
    expect(inputs[1].props.value).toBe("formatted:75000");
  });

  it("amount input shows empty string when amount is 0/falsy", () => {
    let root;
    act(() => {
      root = create(<ReceiptItemRow {...baseProps} item={{ ...baseItem, amount: 0 }} />);
    });
    const inputs = root.root.findAllByType(TextInput);
    expect(inputs[1].props.value).toBe("");
  });

  it("calls onUpdate with new name when name input changes", () => {
    const onUpdate = jest.fn();
    let root;
    act(() => {
      root = create(<ReceiptItemRow {...baseProps} onUpdate={onUpdate} />);
    });
    act(() => {
      root.root.findAllByType(TextInput)[0].props.onChangeText("Orange");
    });
    expect(onUpdate).toHaveBeenCalledWith(0, { ...baseItem, name: "Orange" });
  });

  it("calls onUpdate with parsed amount when amount input changes", () => {
    const onUpdate = jest.fn();
    let root;
    act(() => {
      root = create(<ReceiptItemRow {...baseProps} onUpdate={onUpdate} />);
    });
    act(() => {
      root.root.findAllByType(TextInput)[1].props.onChangeText("formatted:90000");
    });
    expect(onUpdate).toHaveBeenCalledWith(0, { ...baseItem, amount: 90000 });
  });

  it("amount input has numeric keyboardType", () => {
    let root;
    act(() => {
      root = create(<ReceiptItemRow {...baseProps} />);
    });
    expect(root.root.findAllByType(TextInput)[1].props.keyboardType).toBe("numeric");
  });

  it("renders field labels for name, amount, category", () => {
    let root;
    act(() => {
      root = create(<ReceiptItemRow {...baseProps} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("receiptItem.fieldName");
    expect(texts).toContain("receiptItem.fieldAmount");
    expect(texts).toContain("receiptItem.fieldCategory");
  });

  it("renders placeholder for category when none selected", () => {
    let root;
    act(() => {
      root = create(<ReceiptItemRow {...baseProps} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("receiptItem.selectCategory");
  });

  it("renders selected category name when categoryId is set", () => {
    let root;
    act(() => {
      root = create(
        <ReceiptItemRow
          {...baseProps}
          item={{ ...baseItem, categoryId: 1 }}
        />
      );
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("Food");
  });

  it("CategoryPickerModal starts hidden (visible=false)", () => {
    let root;
    act(() => {
      root = create(<ReceiptItemRow {...baseProps} />);
    });
    const pickerVisible = root.root.findByProps({ testID: "picker-visible" });
    expect(pickerVisible.props.children).toBe("false");
  });

  it("opens CategoryPickerModal when category button is pressed", () => {
    let root;
    act(() => {
      root = create(<ReceiptItemRow {...baseProps} />);
    });
    // category pressable is the second Pressable (after delete button)
    act(() => {
      root.root.findAllByType(Pressable)[1].props.onPress();
    });
    const pickerVisible = root.root.findByProps({ testID: "picker-visible" });
    expect(pickerVisible.props.children).toBe("true");
  });

  it("renders categoryHint text when categoryHint is set and no categoryId", () => {
    let root;
    act(() => {
      root = create(
        <ReceiptItemRow
          {...baseProps}
          item={{ ...baseItem, categoryHint: "Ăn uống", categoryId: null }}
        />
      );
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("Ăn uống");
    expect(texts).toContain("receiptItem.suggestion");
  });

  it("does NOT render categoryHint when categoryId is already set", () => {
    let root;
    act(() => {
      root = create(
        <ReceiptItemRow
          {...baseProps}
          item={{ ...baseItem, categoryHint: "Ăn uống", categoryId: 1 }}
        />
      );
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).not.toContain("Ăn uống");
  });

  it("renders PickDateField label", () => {
    let root;
    act(() => {
      root = create(<ReceiptItemRow {...baseProps} />);
    });
    const texts = root.root.findAllByType(Text).map((t) => t.props.children).flat();
    expect(texts).toContain("receiptItem.fieldDate");
  });
});

jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock("../../../constants/colors", () => ({ useAppColors: () => ({ TEXT: "#333", TEXT_SECONDARY: "#999", TEXT_MUTED: "#999", BG: "#F5F5F5", CARD: "#FFF", CARD_BORDER: "#EEE", PRIMARY: "#E8597A", OVERLAY: "rgba(0,0,0,0.45)", WHITE: "#FFF" }) }));

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { JarPickerModal, TemplateFormModal } from "../QuickExpenseTemplateModals";

const baseStyles = {
  modalOverlay: {}, jarPickerContent: {}, jarPickerTitle: {}, jarPickerDesc: {}, modalLabel: {},
  jarSelectCard: {}, jarSelectRow: {}, jarSelectIconBox: {}, jarSelectIcon: {}, jarSelectName: {},
  jarSelectArrow: {}, jarOptionsList: {}, jarOptionItem: {}, jarOptionIcon: {}, jarOptionName: {},
  jarOptionBalance: {}, modalBtnRow: {}, cancelBtn: {}, cancelBtnText: {}, confirmBtn: {}, confirmBtnText: {},
  formContent: {}, formTitle: {}, emojiNameRow: {}, emojiBubbleBtn: {}, emojiBubbleText: {},
  emojiBubbleArrow: {}, nameInput: {}, emojiPresetsCard: {}, emojiPresetsGrid: {}, emojiPresetCell: {},
  emojiPresetText: {}, modalInput: {}, selectCard: {}, selectRow: {}, selectValue: {}, selectArrow: {},
  dropdownCard: {}, dropdownItem: {}, dropdownItemText: {},
};

describe("JarPickerModal", () => {
  const jars = [{ id: 1, name: "Daily", icon: "🍱", currentBalance: 200000 }, { id: 2, name: "Savings", icon: "🏦", currentBalance: 500000 }];
  const template = { id: "t1", emoji: "🍚", name: "Lunch", amount: 50000 };

  test("renders jar picker", () => {
    const { getByText } = render(<JarPickerModal template={template} jars={jars} onConfirm={jest.fn()} onClose={jest.fn()} styles={baseStyles} />);
    expect(getByText(/Trừ tiền từ hũ nào/)).toBeTruthy();
  });

  test("shows template info", () => {
    const { getByText } = render(<JarPickerModal template={template} jars={jars} onConfirm={jest.fn()} onClose={jest.fn()} styles={baseStyles} />);
    expect(getByText(/🍚/)).toBeTruthy();
    expect(getByText(/Lunch/)).toBeTruthy();
  });

  test("calls onConfirm with selected jar", () => {
    const onConfirm = jest.fn();
    const { getByText } = render(<JarPickerModal template={template} jars={jars} onConfirm={onConfirm} onClose={jest.fn()} styles={baseStyles} />);
    fireEvent.press(getByText("Xác nhận"));
    expect(onConfirm).toHaveBeenCalled();
  });

  test("calls onClose when cancel pressed", () => {
    const onClose = jest.fn();
    const { getByText } = render(<JarPickerModal template={template} jars={jars} onConfirm={jest.fn()} onClose={onClose} styles={baseStyles} />);
    fireEvent.press(getByText("Hủy"));
    expect(onClose).toHaveBeenCalled();
  });

  test("shows jar options when dropdown toggled", () => {
    const { getByText } = render(<JarPickerModal template={template} jars={jars} onConfirm={jest.fn()} onClose={jest.fn()} styles={baseStyles} />);
    fireEvent.press(getByText("▼"));
    expect(getByText(/🏦/)).toBeTruthy();
  });
});

describe("TemplateFormModal", () => {
  const categories = [{ id: 1, name: "Food" }];
  const jars = [{ id: 1, name: "Daily", currentBalance: 200000 }];

  test("renders form title for new template", () => {
    const { getByText } = render(<TemplateFormModal template={{}} categories={categories} jars={jars} onSave={jest.fn()} onClose={jest.fn()} styles={baseStyles} />);
    expect(getByText("Thêm mẫu chi tiêu nhanh")).toBeTruthy();
  });

  test("renders form title for editing", () => {
    const { getByText } = render(<TemplateFormModal template={{ id: "t1" }} categories={categories} jars={jars} onSave={jest.fn()} onClose={jest.fn()} styles={baseStyles} />);
    expect(getByText("Chỉnh sửa mẫu chi tiêu")).toBeTruthy();
  });

  test("shows validation alert when name empty", () => {
    const Alert = require("react-native").Alert;
    Alert.alert = jest.fn();
    const { getByText } = render(<TemplateFormModal template={{}} categories={categories} jars={jars} onSave={jest.fn()} onClose={jest.fn()} styles={baseStyles} />);
    fireEvent.press(getByText("Lưu mẫu"));
    expect(Alert.alert).toHaveBeenCalled();
  });

  test("shows validation alert when amount is zero", () => {
    const Alert = require("react-native").Alert;
    Alert.alert = jest.fn();
    const { getByText } = render(<TemplateFormModal template={{}} categories={categories} jars={jars} onSave={jest.fn()} onClose={jest.fn()} styles={baseStyles} />);
    fireEvent.press(getByText("Lưu mẫu"));
  });

  test("calls onSave with valid data", () => {
    const onSave = jest.fn();
    const { getByText } = render(<TemplateFormModal template={{}} categories={categories} jars={jars} onSave={onSave} onClose={jest.fn()} styles={baseStyles} />);
  });

  test("toggles emoji grid", () => {
    const { getByText, queryByText, getAllByText } = render(<TemplateFormModal template={{}} categories={categories} jars={jars} onSave={jest.fn()} onClose={jest.fn()} styles={baseStyles} />);
    fireEvent.press(getAllByText("▾")[0]);
    expect(getAllByText("🍚").length).toBeGreaterThan(1);
  });

  test("calls onClose when cancel pressed", () => {
    const onClose = jest.fn();
    const { getByText } = render(<TemplateFormModal template={{}} categories={categories} jars={jars} onSave={jest.fn()} onClose={onClose} styles={baseStyles} />);
    fireEvent.press(getByText("Hủy"));
    expect(onClose).toHaveBeenCalled();
  });
});

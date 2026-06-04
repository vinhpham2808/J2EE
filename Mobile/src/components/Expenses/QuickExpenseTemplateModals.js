import React, { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { formatCurrencyInput, formatMoney, parseCurrencyInput } from "../../utils/format";

const COMMON_EMOJIS = ["🍚", "☕", "⛽", "🛒", "🧋", "🍜", "🍔", "🥤", "🏥", "📱", "👗", "🎮", "🎬", "📚", "🏋️", "🚕", "✈️", "🎁", "💊", "🧴"];

export function JarPickerModal({ template, jars, onConfirm, onClose, styles }) {
  const [selectedJarId, setSelectedJarId] = useState(template.jarId ?? (jars[0]?.id ?? ""));
  const [showPicker, setShowPicker] = useState(false);

  const selectedJar = jars.find((j) => j.id === Number(selectedJarId)) || jars[0];

  return (
    <Modal visible animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.jarPickerContent}>
          <Text style={styles.jarPickerTitle}>Trừ tiền từ hũ nào?</Text>
          <Text style={styles.jarPickerDesc}>
            Ghi nhận khoản: {template.emoji} {template.name} — {formatMoney(template.amount)}
          </Text>

          <Text style={styles.modalLabel}>Chọn hũ chi tiêu</Text>
          <Pressable style={styles.jarSelectCard} onPress={() => setShowPicker(!showPicker)}>
            <View style={styles.jarSelectRow}>
              <View style={[styles.jarSelectIconBox, { backgroundColor: (selectedJar?.color || COLORS.PRIMARY) + "18" }]}>
                <Text style={styles.jarSelectIcon}>{selectedJar?.icon || "🏺"}</Text>
              </View>
              <Text style={styles.jarSelectName}>{selectedJar?.name || "Chọn hũ..."}</Text>
              <Text style={styles.jarSelectArrow}>▾</Text>
            </View>
          </Pressable>

          {showPicker && (
            <View style={styles.jarOptionsList}>
              <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                {jars.map((jar) => (
                  <Pressable
                    key={jar.id}
                    style={styles.jarOptionItem}
                    onPress={() => {
                      setSelectedJarId(jar.id);
                      setShowPicker(false);
                    }}
                  >
                    <Text style={styles.jarOptionIcon}>{jar.icon || "🏺"}</Text>
                    <Text style={styles.jarOptionName}>{jar.name}</Text>
                    <Text style={styles.jarOptionBalance}>({formatMoney(jar.currentBalance)})</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.modalBtnRow}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </Pressable>
            <Pressable style={styles.confirmBtn} onPress={() => onConfirm(selectedJarId)}>
              <Text style={styles.confirmBtnText}>Xác nhận</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function TemplateFormModal({ template, categories, jars, onSave, onClose, styles }) {
  const isNew = !template?.id;
  const [emoji, setEmoji] = useState(template?.emoji || "🍚");
  const [name, setName] = useState(template?.name || "");
  const [amount, setAmount] = useState(template?.amount ? formatCurrencyInput(String(template.amount)) : "");
  const [categoryId, setCategoryId] = useState(template?.categoryId || (categories[0]?.id ?? ""));
  const [jarId, setJarId] = useState(template?.jarId ?? "");

  const [showEmojiGrid, setShowEmojiGrid] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showJarPicker, setShowJarPicker] = useState(false);

  const selectedCategory = categories.find((category) => category.id === Number(categoryId)) || categories[0];
  const selectedJar = jars.find((jar) => jar.id === Number(jarId));

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên mẫu.");
      return;
    }

    const parsedAmount = parseCurrencyInput(amount);
    if (parsedAmount <= 0) {
      Alert.alert("Số tiền không hợp lệ", "Vui lòng nhập số tiền lớn hơn 0.");
      return;
    }

    onSave({
      ...template,
      emoji,
      name: name.trim(),
      amount: parsedAmount,
      categoryId: categoryId ? Number(categoryId) : null,
      jarId: jarId ? Number(jarId) : null,
    });
  };

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.formContent}>
          <Text style={styles.formTitle}>{isNew ? "Thêm mẫu chi tiêu nhanh" : "Chỉnh sửa mẫu chi tiêu"}</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={styles.modalLabel}>Biểu tượng & Tên mẫu</Text>
            <View style={styles.emojiNameRow}>
              <Pressable style={styles.emojiBubbleBtn} onPress={() => setShowEmojiGrid(!showEmojiGrid)}>
                <Text style={styles.emojiBubbleText}>{emoji}</Text>
                <Text style={styles.emojiBubbleArrow}>▾</Text>
              </Pressable>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="VD: Cơm trưa, Siêu thị"
                placeholderTextColor={COLORS.TEXT_MUTED}
              />
            </View>

            {showEmojiGrid && (
              <View style={styles.emojiPresetsCard}>
                <View style={styles.emojiPresetsGrid}>
                  {COMMON_EMOJIS.map((item) => (
                    <Pressable
                      key={item}
                      style={styles.emojiPresetCell}
                      onPress={() => {
                        setEmoji(item);
                        setShowEmojiGrid(false);
                      }}
                    >
                      <Text style={styles.emojiPresetText}>{item}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <Text style={styles.modalLabel}>Số tiền mặc định (VND)</Text>
            <TextInput
              style={styles.modalInput}
              value={amount}
              onChangeText={(val) => setAmount(formatCurrencyInput(val))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={COLORS.TEXT_MUTED}
            />

            {categories.length > 0 && (
              <>
                <Text style={styles.modalLabel}>Danh mục liên kết (Tùy chọn)</Text>
                <Pressable style={styles.selectCard} onPress={() => setShowCategoryPicker(!showCategoryPicker)}>
                  <View style={styles.selectRow}>
                    <Text style={styles.selectValue}>{selectedCategory?.name || "Chọn danh mục..."}</Text>
                    <Text style={styles.selectArrow}>▾</Text>
                  </View>
                </Pressable>

                {showCategoryPicker && (
                  <View style={styles.dropdownCard}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                      {categories.map((category) => (
                        <Pressable
                          key={category.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setCategoryId(category.id);
                            setShowCategoryPicker(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{category.name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </>
            )}

            {jars.length > 0 && (
              <>
                <Text style={styles.modalLabel}>Hũ mặc định liên kết (Tùy chọn)</Text>
                <Pressable style={styles.selectCard} onPress={() => setShowJarPicker(!showJarPicker)}>
                  <View style={styles.selectRow}>
                    <Text style={styles.selectValue}>{selectedJar ? `🏦 ${selectedJar.name}` : "Không liên kết hũ"}</Text>
                    <Text style={styles.selectArrow}>▾</Text>
                  </View>
                </Pressable>

                {showJarPicker && (
                  <View style={styles.dropdownCard}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                      <Pressable
                        style={styles.dropdownItem}
                        onPress={() => {
                          setJarId("");
                          setShowJarPicker(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, { color: COLORS.PRIMARY }]}>Không liên kết hũ</Text>
                      </Pressable>
                      {jars.map((jar) => (
                        <Pressable
                          key={jar.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setJarId(jar.id);
                            setShowJarPicker(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>🏦 {jar.name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          <View style={styles.modalBtnRow}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </Pressable>
            <Pressable style={styles.confirmBtn} onPress={handleSubmit}>
              <Text style={styles.confirmBtnText}>Lưu mẫu</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

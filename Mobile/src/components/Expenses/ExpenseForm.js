import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { PickDateField } from "../../utils/pickDate";
import CategoryGridSelector from "../common/CategoryGridSelector";
import ExpenseNoteField from "./ExpenseNoteField";

export default function ExpenseForm({ form, insetsStyle, isPremium, isScanning, onImportReceipt }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, insetsStyle]}>
      <Pressable
        style={[styles.importBanner, isScanning && styles.importBannerScanning]}
        onPress={onImportReceipt}
        disabled={isScanning}
      >
        {isScanning ? (
          <View style={styles.importBannerInner}>
            <ActivityIndicator color={COLORS.PRIMARY} size="small" />
            <Text style={styles.importBannerText}>Đang phân tích hóa đơn...</Text>
          </View>
        ) : (
          <View style={styles.importBannerInner}>
            <Text style={styles.importBannerIcon}>📎</Text>
            <View style={styles.importBannerBody}>
              <Text style={styles.importBannerTitle}>Nhập từ hóa đơn</Text>
              <Text style={styles.importBannerSub}>Chọn ảnh hoặc PDF{!isPremium ? "  •  Premium" : ""}</Text>
            </View>
            <Text style={styles.importBannerChevron}>›</Text>
          </View>
        )}
      </Pressable>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>hoặc nhập tay</Text>
        <View style={styles.dividerLine} />
      </View>

      <Text style={styles.label}>Tên khoản chi</Text>
      <TextInput
        style={styles.input}
        value={form.name}
        onChangeText={form.setName}
        placeholder="Ví dụ: Mua đồ ăn"
        placeholderTextColor={COLORS.TEXT_MUTED}
      />

      <Text style={styles.label}>Số tiền</Text>
      <TextInput
        style={styles.input}
        value={form.amount}
        onChangeText={form.setAmount}
        keyboardType="numeric"
        placeholder="Ví dụ: 120.000"
        placeholderTextColor={COLORS.TEXT_MUTED}
      />

      <ExpenseNoteField value={form.note} onChange={form.setNote} onVoiceResult={form.handleVoiceResult} />

      {form.splitInfo?.splits?.length > 0 && (
        <View style={styles.splitBanner}>
          <Text style={styles.splitTitle}>Phát hiện chia tiền</Text>
          {form.splitInfo.splits.map((split, index) => (
            <Text key={`${split.label}-${index}`} style={styles.splitText}>
              {split.label}
            </Text>
          ))}
          {form.splitInfo.myShareLabel && <Text style={styles.splitMyShare}>{form.splitInfo.myShareLabel}</Text>}
        </View>
      )}

      <PickDateField label="Ngày" value={form.date} onChange={form.setDate} />

      <Text style={styles.label}>Hũ chi tiêu liên kết</Text>
      {form.jarsLoading ? (
        <Text style={styles.mutedText}>Đang tải danh sách hũ...</Text>
      ) : form.jars.length === 0 ? (
        <Text style={styles.mutedText}>Chưa tạo hũ chi tiêu nào. Hãy thiết lập trong Tiện ích khác.</Text>
      ) : (
        <View style={styles.jarsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jarsContainer}>
            {form.jars.map((jar) => {
              const isSelected = String(jar.id) === form.jarId;
              const color = jar.color || COLORS.PRIMARY;
              return (
                <Pressable
                  key={jar.id}
                  onPress={() => form.setJarId(isSelected ? "" : String(jar.id))}
                  style={[styles.jarItem, isSelected && { borderColor: color, backgroundColor: `${color}12` }]}
                >
                  <View style={[styles.jarEmojiBox, { backgroundColor: `${color}18` }]}>
                    <Text style={styles.jarEmoji}>{jar.icon || "🏺"}</Text>
                  </View>
                  <Text style={[styles.jarName, isSelected && { color, fontWeight: "800" }]}>{jar.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <Text style={styles.label}>Danh mục</Text>
      <CategoryGridSelector
        categories={form.categories}
        selectedId={form.categoryId}
        onSelect={form.setCategoryId}
        loading={form.categoryLoading}
        emptyText="Chưa có danh mục chi tiêu. Hãy tạo danh mục ở tab Danh mục."
      />

      <Pressable style={[styles.saveButton, form.submitting && styles.saveButtonDisabled]} onPress={form.onSave} disabled={form.submitting}>
        <Text style={styles.saveButtonText}>{form.submitting ? "Đang lưu..." : "Lưu chi tiêu"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG
  },
  content: {
    padding: 16
  },
  importBanner: {
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: `${COLORS.PRIMARY}40`,
    borderStyle: "dashed",
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 6
  },
  importBannerScanning: {
    opacity: 0.7
  },
  importBannerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  importBannerIcon: {
    fontSize: 22
  },
  importBannerBody: {
    flex: 1
  },
  importBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.PRIMARY
  },
  importBannerSub: {
    fontSize: 11,
    color: COLORS.TEXT_MUTED,
    marginTop: 1
  },
  importBannerText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.TEXT_SECONDARY,
    marginLeft: 8
  },
  importBannerChevron: {
    fontSize: 22,
    color: COLORS.PRIMARY,
    fontWeight: "700"
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
    gap: 8
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.CARD_BORDER
  },
  dividerText: {
    fontSize: 11,
    color: COLORS.TEXT_MUTED,
    fontWeight: "600"
  },
  label: {
    color: COLORS.TEXT,
    marginBottom: 6,
    fontWeight: "600"
  },
  input: {
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 12,
    color: COLORS.TEXT
  },
  mutedText: {
    fontSize: 13,
    color: COLORS.TEXT_MUTED,
    marginBottom: 12
  },
  splitBanner: {
    backgroundColor: COLORS.INFO_LIGHT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d0e3f5",
    padding: 12,
    marginBottom: 12
  },
  splitTitle: {
    fontWeight: "700",
    color: COLORS.INFO,
    fontSize: 14,
    marginBottom: 6
  },
  splitText: {
    fontSize: 13,
    color: COLORS.TEXT,
    marginBottom: 2
  },
  splitMyShare: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.PRIMARY,
    marginTop: 4
  },
  jarsSection: {
    marginBottom: 12
  },
  jarsContainer: {
    paddingVertical: 4,
    flexDirection: "row",
    gap: 8
  },
  jarItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8
  },
  jarEmojiBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8
  },
  jarEmoji: {
    fontSize: 14
  },
  jarName: {
    fontSize: 13,
    color: COLORS.TEXT,
    fontWeight: "600"
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 12
  },
  saveButtonDisabled: {
    opacity: 0.6
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontWeight: "700",
    fontSize: 15
  }
});

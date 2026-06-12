import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAppColors } from "../../constants/colors";
import { PickDateField } from "../../utils/datePicker";
import CategoryGridSelector from "../common/CategoryGridSelector";
import ExpenseNoteField from "./ExpenseNoteField";
import AppIcon from "../ui/AppIcon";
import { formatMoney } from "../../utils/format";
import { getJarBalanceAmount } from "../../utils/jar";
import ScreenBackHeader from "../common/ScreenBackHeader";
import { scale } from "../../utils/layoutScale";

export default function ExpenseForm({ form, insetsStyle, isPremium, isScanning, onImportReceipt, title = "Thêm chi tiêu" }) {
  const colors = useAppColors();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.BG }]} contentContainerStyle={[styles.content, insetsStyle]} keyboardShouldPersistTaps="handled">
      <ScreenBackHeader title={title} />

      {/* SECTION 1: THÔNG TIN GIAO DỊCH */}
      <View style={[styles.sectionContainer, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER, shadowColor: colors.SHADOW_COLOR || "#000" }]}>
        <Text style={[styles.sectionTitle, { color: colors.ACTION_EXPENSE || "#F97316" }]}>Thông tin giao dịch</Text>

        <Text style={[styles.amountLabel, { color: colors.TEXT_SECONDARY }]}>Số tiền chi tiêu</Text>
        <TextInput
          style={[styles.amountInput, { borderBottomColor: colors.ACTION_EXPENSE || "#F97316", color: colors.TEXT }]}
          value={form.amount}
          onChangeText={form.setAmount}
          keyboardType="numeric"
          placeholder="0 ₫"
          placeholderTextColor={colors.TEXT_MUTED}
          selectTextOnFocus
        />

        <Text style={[styles.label, { color: colors.TEXT }]}>Tên khoản chi</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.BG, borderColor: colors.CARD_BORDER, color: colors.TEXT }]}
          value={form.name}
          onChangeText={form.setName}
          placeholder="Ví dụ: Mua đồ ăn"
          placeholderTextColor={colors.TEXT_MUTED}
        />

        <PickDateField label="Ngày chi" value={form.date} onChange={form.setDate} />
      </View>

      {/* SECTION 2: DANH MỤC & HŨ */}
      <View style={[styles.sectionContainer, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER, shadowColor: colors.SHADOW_COLOR || "#000" }]}>
        <Text style={[styles.sectionTitle, { color: colors.ACTION_EXPENSE || "#F97316" }]}>Phân loại chi tiêu</Text>

        <Text style={[styles.label, { color: colors.TEXT, marginBottom: 8 }]}>Danh mục</Text>
        <CategoryGridSelector
          categories={form.categories}
          selectedId={form.categoryId}
          onSelect={form.setCategoryId}
          loading={form.categoryLoading}
          highlighted
          hintText="Chạm để chọn nhóm chi tiêu"
          placeholder="Chọn ngay"
          emptyText="Chưa có danh mục. Hãy tạo ở tab Danh mục."
        />

        <Text style={[styles.label, { color: colors.TEXT, marginTop: 16, marginBottom: 8 }]}>Hũ tài chính liên kết</Text>
        {form.jarsLoading ? (
          <Text style={[styles.mutedText, { color: colors.TEXT_MUTED }]}>Đang tải danh sách hũ...</Text>
        ) : form.jars.length === 0 ? (
          <Text style={[styles.mutedText, { color: colors.TEXT_MUTED }]}>Chưa tạo hũ. Hãy thiết lập trong Tiện ích khác.</Text>
        ) : (
          <View style={styles.jarsSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jarsContainer}>
              {form.jars.map((jar) => {
                const isSelected = String(jar.id) === form.jarId;
                const color = jar.color || colors.ACTION_EXPENSE || "#F97316";
                return (
                  <Pressable
                    key={jar.id}
                    onPress={() => form.setJarId(isSelected ? "" : String(jar.id))}
                    style={[
                      styles.jarItem,
                      { backgroundColor: colors.BG, borderColor: colors.CARD_BORDER },
                      isSelected && { borderColor: color, backgroundColor: `${color}12` }
                    ]}
                  >
                    <View style={[styles.jarEmojiBox, { backgroundColor: `${color}18` }]}>
                      <Text style={styles.jarEmoji}>{jar.icon || "🏺"}</Text>
                    </View>
                    <View style={styles.jarInfoText}>
                      <Text style={[styles.jarName, { color: colors.TEXT }, isSelected && { color, fontWeight: "800" }]} numberOfLines={1}>{jar.name}</Text>
                      <Text style={[styles.jarBalance, { color: colors.TEXT_SECONDARY }]} numberOfLines={1}>Còn: {formatMoney(getJarBalanceAmount(jar))}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* SECTION 3: GHI CHÚ & HÓA ĐƠN */}
      <View style={[styles.sectionContainer, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER, shadowColor: colors.SHADOW_COLOR || "#000" }]}>
        <Text style={[styles.sectionTitle, { color: colors.ACTION_EXPENSE || "#F97316" }]}>Ghi chú & Hóa đơn</Text>

        <ExpenseNoteField value={form.note} onChange={form.setNote} onVoiceResult={form.handleVoiceResult} />

        {form.splitInfo?.splits?.length > 0 && (
          <View style={[styles.splitBanner, { backgroundColor: colors.INFO_LIGHT, borderColor: colors.INFO }]}>
            <Text style={[styles.splitTitle, { color: colors.INFO }]}>Phát hiện chia tiền</Text>
            {form.splitInfo.splits.map((split, index) => (
              <Text key={`${split.label}-${index}`} style={[styles.splitText, { color: colors.TEXT }]}>
                {split.label}
              </Text>
            ))}
            {form.splitInfo.myShareLabel && <Text style={[styles.splitMyShare, { color: colors.ACTION_EXPENSE || "#F97316" }]}>{form.splitInfo.myShareLabel}</Text>}
          </View>
        )}

        <Pressable
          style={[
            styles.importBanner,
            { backgroundColor: colors.BG, borderColor: colors.ACTION_EXPENSE || "#F97316", shadowColor: colors.ACTION_EXPENSE || "#F97316" },
            isScanning && styles.importBannerScanning
          ]}
          onPress={onImportReceipt}
          disabled={isScanning}
        >
          {isScanning ? (
            <View style={styles.importBannerInner}>
              <ActivityIndicator color={colors.ACTION_EXPENSE || "#F97316"} size="small" />
              <Text style={[styles.importBannerText, { color: colors.TEXT_SECONDARY }]}>Đang phân tích hóa đơn...</Text>
            </View>
          ) : (
            <View style={styles.importBannerInner}>
              <View style={[styles.importBannerIconBox, { backgroundColor: colors.BADGE_NEGATIVE_BG || "rgba(239,94,131,0.1)" }]}>
                <AppIcon name="document-attach-outline" size={18} color={colors.ACTION_EXPENSE || "#F97316"} />
              </View>
              <View style={styles.importBannerBody}>
                <Text style={[styles.importBannerTitle, { color: colors.ACTION_EXPENSE || "#F97316" }]}>Nhập từ hóa đơn AI</Text>
                <Text style={[styles.importBannerSub, { color: colors.TEXT_MUTED }]}>Quét ảnh hóa đơn hoặc file PDF{!isPremium ? "  •  Premium" : ""}</Text>
              </View>
              <AppIcon name="chevron-forward" size={16} color={colors.ACTION_EXPENSE || "#F97316"} />
            </View>
          )}
        </Pressable>
      </View>

      <Pressable style={[styles.saveButton, { backgroundColor: colors.ACTION_EXPENSE || "#F97316" }, form.submitting && styles.saveButtonDisabled]} onPress={form.onSave} disabled={form.submitting}>
        <Text style={styles.saveButtonText}>{form.submitting ? "Đang lưu..." : "Lưu chi tiêu"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    padding: scale(14),
    paddingBottom: scale(100)
  },
  sectionContainer: {
    borderRadius: scale(16),
    borderWidth: 1,
    padding: scale(16),
    marginBottom: scale(14),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: scale(14)
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: scale(2)
  },
  amountInput: {
    fontSize: scale(30),
    fontWeight: "800",
    textAlign: "center",
    paddingVertical: scale(6),
    borderBottomWidth: 1.5,
    marginBottom: scale(16)
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: scale(6)
  },
  input: {
    borderRadius: scale(10),
    borderWidth: 1,
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    marginBottom: scale(12),
    fontSize: 14
  },
  mutedText: {
    fontSize: 13,
    marginBottom: scale(12)
  },
  jarsSection: {
    marginBottom: scale(4)
  },
  jarsContainer: {
    paddingVertical: scale(2),
    flexDirection: "row",
    gap: scale(8)
  },
  jarItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: scale(10),
    borderWidth: 1.5,
    paddingHorizontal: scale(10),
    paddingVertical: scale(8),
    marginRight: scale(4),
    minWidth: scale(130)
  },
  jarEmojiBox: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(6),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(8)
  },
  jarEmoji: {
    fontSize: 15
  },
  jarInfoText: {
    flex: 1
  },
  jarName: {
    fontSize: 13,
    fontWeight: "600"
  },
  jarBalance: {
    fontSize: 10,
    marginTop: scale(1)
  },
  splitBanner: {
    borderRadius: scale(10),
    borderWidth: 1,
    padding: scale(12),
    marginBottom: scale(12)
  },
  splitTitle: {
    fontWeight: "700",
    fontSize: 14,
    marginBottom: scale(4)
  },
  splitText: {
    fontSize: 13,
    marginBottom: scale(2)
  },
  splitMyShare: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: scale(4)
  },
  importBanner: {
    borderRadius: scale(12),
    borderWidth: 1.5,
    borderStyle: "dashed",
    paddingVertical: scale(12),
    paddingHorizontal: scale(14),
    marginBottom: scale(4),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2
  },
  importBannerScanning: {
    opacity: 0.7
  },
  importBannerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10)
  },
  importBannerIconBox: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(17),
    alignItems: "center",
    justifyContent: "center"
  },
  importBannerBody: {
    flex: 1
  },
  importBannerTitle: {
    fontSize: 14,
    fontWeight: "800"
  },
  importBannerSub: {
    fontSize: 11,
    marginTop: scale(1)
  },
  importBannerText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: scale(6)
  },
  saveButton: {
    borderRadius: scale(12),
    paddingVertical: scale(13),
    alignItems: "center",
    marginTop: scale(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2
  },
  saveButtonDisabled: {
    opacity: 0.6
  },
  saveButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16
  }
});


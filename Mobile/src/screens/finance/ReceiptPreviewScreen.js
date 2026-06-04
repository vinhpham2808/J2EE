import React, { useCallback } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import JarSelector from "../../components/Receipt/JarSelector";
import ReceiptItemRow from "../../components/Receipt/ReceiptItemRow";
import ReceiptSummaryCard from "../../components/Receipt/ReceiptSummaryCard";
import { COLORS, useAppColors } from "../../constants/colors";
import useReceiptPreview from "../../hooks/useReceiptPreview";
import { getSafeAreaBottom, getSafeAreaTop } from "../../utils/safeArea";

export default function ReceiptPreviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const {
    categories,
    categoriesLoading,
    confirmImport,
    deleteItem,
    hasInitialItems,
    items,
    jarId,
    jars,
    jarsLoading,
    receiptMeta,
    setJarId,
    submitting,
    totalAmount,
    updateItem
  } = useReceiptPreview({
    analyzeResult: route.params?.analyzeResult,
    onImportSuccess: handleBack
  });

  if (!hasInitialItems && !submitting) {
    return <ReceiptPreviewEmptyState onBack={handleBack} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.BG, paddingTop: getSafeAreaTop(insets) }]}> 
      <ReceiptSummaryCard
        itemCount={items.length}
        location={receiptMeta.location}
        merchant={receiptMeta.merchant}
        receiptDate={receiptMeta.receiptDate}
        totalAmount={totalAmount}
      />

      <ScrollView
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingBottom: getSafeAreaBottom(insets) }]}
        keyboardShouldPersistTaps="handled"
      >
        <JarSelector
          jarId={jarId}
          jars={jars}
          loading={jarsLoading}
          onChange={setJarId}
        />

        {items.map((item, index) => (
          <ReceiptItemRow
            key={String(index)}
            item={item}
            index={index}
            categories={categories}
            categoriesLoading={categoriesLoading}
            onUpdate={updateItem}
            onDelete={deleteItem}
          />
        ))}
      </ScrollView>

      <ReceiptPreviewFooter
        itemCount={items.length}
        onCancel={handleBack}
        onConfirm={confirmImport}
        submitting={submitting}
      />
    </View>
  );
}

function ReceiptPreviewEmptyState({ onBack }) {
  const colors = useAppColors();

  return (
    <View style={[styles.emptyContainer, { backgroundColor: colors.BG }]}> 
      <Text style={styles.emptyIcon}>🧾</Text>
      <Text style={[styles.emptyTitle, { color: colors.TEXT }]}>Không nhận diện được khoản chi</Text>
      <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}> 
        Gemini không tìm thấy mặt hàng nào trong ảnh.{"\n"}
        Hãy thử lại với ảnh rõ hơn hoặc nhập tay.
      </Text>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Quay lại</Text>
      </Pressable>
    </View>
  );
}

function ReceiptPreviewFooter({ itemCount, onCancel, onConfirm, submitting }) {
  const colors = useAppColors();

  return (
    <View style={[styles.footer, { backgroundColor: colors.CARD, borderTopColor: colors.CARD_BORDER }]}> 
      <Pressable style={styles.confirmButton} onPress={onConfirm} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color={colors.WHITE} size="small" />
        ) : (
          <Text style={styles.confirmButtonText}>✅ Xác nhận lưu ({itemCount} mục)</Text>
        )}
      </Pressable>

      <Pressable style={[styles.cancelButton, { borderColor: colors.CARD_BORDER }]} onPress={onCancel} disabled={submitting}>
        <Text style={[styles.cancelButtonText, { color: colors.TEXT_SECONDARY }]}>Hủy</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG
  },
  list: {
    flex: 1
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
    paddingBottom: 24
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.BG,
    justifyContent: "center",
    alignItems: "center",
    padding: 32
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.TEXT,
    marginBottom: 8,
    textAlign: "center"
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20
  },
  backButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28
  },
  backButtonText: {
    color: COLORS.WHITE,
    fontWeight: "700",
    fontSize: 15
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.CARD,
    borderTopWidth: 1,
    borderTopColor: COLORS.CARD_BORDER,
    gap: 10
  },
  confirmButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3
  },
  confirmButtonText: {
    color: COLORS.WHITE,
    fontWeight: "800",
    fontSize: 16
  },
  cancelButton: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER
  },
  cancelButtonText: {
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "600",
    fontSize: 14
  }
});

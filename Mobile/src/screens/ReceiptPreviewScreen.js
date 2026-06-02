import React, { useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import JarSelector from "../components/ReceiptPreview/JarSelector";
import ReceiptItemRow from "../components/ReceiptPreview/ReceiptItemRow";
import ReceiptPreviewEmptyState from "../components/ReceiptPreview/ReceiptPreviewEmptyState";
import ReceiptPreviewFooter from "../components/ReceiptPreview/ReceiptPreviewFooter";
import ReceiptSummaryCard from "../components/ReceiptPreview/ReceiptSummaryCard";
import { COLORS } from "../constants/colors";
import useReceiptPreview from "../hooks/useReceiptPreview";
import { getSafeAreaBottom, getSafeAreaTop } from "../utils/safeAreaSpacing";

export default function ReceiptPreviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

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
    <View style={[styles.container, { paddingTop: getSafeAreaTop(insets) }]}>
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
  }
});

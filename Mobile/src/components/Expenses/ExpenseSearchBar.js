import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS } from "../../constants/colors";

export default function ExpenseSearchBar({ value, onChangeText, onClear }) {
  return (
    <View style={styles.searchBar}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder="Tìm kiếm ghi chú, tên chi tiêu..."
        placeholderTextColor={COLORS.TEXT_MUTED}
      />
      {value ? (
        <Pressable onPress={onClear} style={styles.searchClear}>
          <Text style={styles.searchClearText}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 12,
    marginBottom: 10
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.TEXT
  },
  searchClear: {
    padding: 6
  },
  searchClearText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY
  }
});

import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";

export default function JarSelector({ jarId, jars, loading, onChange }) {
  return (
    <View style={styles.jarsCard}>
      <Text style={styles.jarsLabel}>Hũ chi tiêu áp dụng</Text>
      {loading ? (
        <Text style={styles.mutedText}>Đang tải danh sách hũ...</Text>
      ) : jars.length === 0 ? (
        <Text style={styles.mutedText}>Không tìm thấy hũ chi tiêu nào.</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.jarsRow}
        >
          {jars.map((jar) => {
            const isSelected = String(jar.id) === jarId;
            const accentColor = jar.color || COLORS.PRIMARY;
            return (
              <Pressable
                key={jar.id}
                onPress={() => onChange(isSelected ? "" : String(jar.id))}
                style={[
                  styles.jarItem,
                  isSelected && {
                    borderColor: accentColor,
                    backgroundColor: `${accentColor}12`
                  }
                ]}
              >
                <View style={[styles.jarEmojiBox, { backgroundColor: `${accentColor}18` }]}>
                  <Text style={styles.jarEmoji}>{jar.icon || "🏺"}</Text>
                </View>
                <Text
                  style={[
                    styles.jarName,
                    isSelected && {
                      color: accentColor,
                      fontWeight: "800"
                    }
                  ]}
                >
                  {jar.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  jarsCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 12,
    marginBottom: 4
  },
  jarsLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8
  },
  mutedText: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED
  },
  jarsRow: {
    flexDirection: "row",
    gap: 8
  },
  jarItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6
  },
  jarEmojiBox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6
  },
  jarEmoji: {
    fontSize: 12
  },
  jarName: {
    fontSize: 12,
    color: COLORS.TEXT,
    fontWeight: "600"
  }
});

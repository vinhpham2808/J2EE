import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LANGUAGES } from "../../constants/languages";
import { COLORS, useAppColors } from "../../constants/colors";

export default function LanguageSelector({ visible, selectedLanguageCode, onClose, onApply }) {
  const colors = useAppColors();
  const isDark = colors.BG === "#0F0D0C";
  const [draftLanguageCode, setDraftLanguageCode] = useState(selectedLanguageCode);

  useEffect(() => {
    if (visible) setDraftLanguageCode(selectedLanguageCode);
  }, [selectedLanguageCode, visible]);

  const handleApply = () => {
    onApply(draftLanguageCode);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.selector, { backgroundColor: colors.CARD, shadowColor: colors.SHADOW_COLOR || "#000" }]}> 
          <Text style={[styles.title, { color: colors.TEXT }]}>Chọn ngôn ngữ của bạn</Text>

          <View style={[styles.optionPanel, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#EAF6EF" }]}> 
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.optionList}>
              {LANGUAGES.map((language) => {
                const selected = draftLanguageCode === language.code;
                return (
                  <Pressable
                    key={language.code}
                    onPress={() => setDraftLanguageCode(language.code)}
                    style={({ pressed }) => [
                      styles.optionCard,
                      {
                        backgroundColor: colors.CARD,
                        borderColor: selected ? "#1E3A5F" : colors.CARD_BORDER,
                        shadowColor: colors.SHADOW_COLOR || "#000"
                      },
                      pressed && styles.optionCardPressed
                    ]}
                  >
                    <Text style={styles.flag}>{language.flag}</Text>
                    <View style={styles.optionTextWrap}>
                      <Text style={[styles.optionTitle, { color: colors.TEXT }]}>{language.label}</Text>
                      <Text style={[styles.optionSubtitle, { color: colors.TEXT_SECONDARY }]}>{language.subtitle}</Text>
                    </View>
                    <View
                      style={[
                        styles.radio,
                        {
                          borderColor: selected ? "#1E3A5F" : colors.TEXT_MUTED,
                          backgroundColor: selected ? "#1E3A5F" : "transparent"
                        }
                      ]}
                    >
                      {selected ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable style={({ pressed }) => [styles.applyButton, pressed && styles.applyButtonPressed]} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Áp dụng</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.42)"
  },
  selector: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 14,
    paddingBottom: 18,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 18
  },
  title: {
    fontSize: 18,
    fontWeight: "850",
    marginBottom: 12,
    paddingHorizontal: 2
  },
  optionPanel: {
    borderRadius: 16,
    padding: 10,
    gap: 12
  },
  optionList: {
    gap: 10
  },
  optionCard: {
    minHeight: 62,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  optionCardPressed: {
    opacity: 0.86
  },
  flag: {
    fontSize: 30,
    marginRight: 12
  },
  optionTextWrap: {
    flex: 1,
    minWidth: 0
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "800"
  },
  optionSubtitle: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "500"
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center"
  },
  applyButton: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#082D63"
  },
  applyButtonPressed: {
    opacity: 0.88
  },
  applyButtonText: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: "850"
  }
});

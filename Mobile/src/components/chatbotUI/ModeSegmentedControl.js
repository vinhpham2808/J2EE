import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";

export default function ModeSegmentedControl({
  activeMode,
  isFreePlan,
  onChangeMode,
  embedded = false,
}) {
  const modes = [
    { value: "chat", label: "Trò chuyện", icon: "message-reply-text-outline" },
    { value: "agent", label: "Tác vụ", icon: "robot-outline" },
  ];

  return (
    <View style={[styles.modeContainer, embedded && styles.modeContainerEmbedded]}>
      {modes.map((mode) => {
        const isActive = activeMode === mode.value;

        return (
          <Pressable
            key={mode.value}
            style={[styles.modeTab, isActive && styles.modeTabActive]}
            onPress={() => onChangeMode(mode.value)}
          >
            <MaterialCommunityIcons
              name={mode.icon}
              size={18}
              color={isActive ? COLORS.WHITE : COLORS.TEXT_SECONDARY}
            />
            <Text style={[styles.modeText, isActive && styles.modeTextActive]}>
              {mode.label}
            </Text>
            {mode.value === "agent" && isFreePlan ? (
              <MaterialCommunityIcons
                name="lock-outline"
                size={12}
                color={isActive ? COLORS.WHITE : COLORS.TEXT_MUTED}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  modeContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    height: 48,
    padding: 3,
    flexDirection: "row",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(239, 94, 131, 0.22)",
    backgroundColor: "rgba(255, 255, 255, 0.82)",
  },
  modeContainerEmbedded: {
    marginHorizontal: 0,
    marginTop: 0,
  },
  modeTab: {
    flex: 1,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },
  modeTabActive: {
    backgroundColor: COLORS.PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY_LIGHT,
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  modeText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.TEXT_SECONDARY,
  },
  modeTextActive: {
    color: COLORS.WHITE,
  },
});

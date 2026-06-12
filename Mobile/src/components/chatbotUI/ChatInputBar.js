import React, { useEffect, useRef } from "react";
import { Image, StyleSheet, Text, View, TextInput, Pressable, Platform, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, useAppColors } from "../../constants/colors";
import { getSafeAreaBottom } from "../../utils/safeArea";

const MIC_ICON = require("../../assets/accessories/mic.png");

export default function ChatInputBar({
  value = "",
  onChangeText,
  onSend,
  onStop,
  placeholder,
  loading,
  disabled,
  onMicPress,
  isRecording
}) {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const isDisabled = loading || disabled;
  const hasText = value.trim().length > 0;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true })
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
    pulseAnim.setValue(1);
  }, [isRecording, pulseAnim]);

  // Premium Translucent background for glassmorphic effect
  const isDark = colors.CHAT_BG === '#0F0A0F';
  const glassBg = isDark ? "rgba(31, 26, 31, 0.85)" : "rgba(255, 255, 255, 0.85)";

  const renderRightAction = () => {
    if (loading && onStop) {
      return (
        <Pressable
          style={[styles.actionCircle, styles.actionCircleStop]}
          onPress={onStop}
          accessibilityRole="button"
          accessibilityLabel="Dừng tạo phản hồi"
        >
          <Ionicons name="square" size={16} color={COLORS.WHITE} />
        </Pressable>
      );
    }

    if (hasText) {
      return (
        <Pressable
          style={[styles.actionCircle, { backgroundColor: colors.PRIMARY }, isDisabled && styles.actionCircleDisabled]}
          onPress={onSend}
          disabled={isDisabled}
        >
          <Ionicons name="send" size={16} color={COLORS.WHITE} style={{ marginLeft: 2 }} />
        </Pressable>
      );
    }

    if (isRecording) {
      return (
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Pressable
            style={[
              styles.actionCircle,
              styles.actionCircleRecording,
              isDisabled && styles.actionCircleDisabled
            ]}
            onPress={onMicPress}
            disabled={isDisabled}
          >
            <Ionicons name="pulse" size={18} color={COLORS.WHITE} />
          </Pressable>
        </Animated.View>
      );
    }

    return (
      <Pressable
        style={[styles.actionCircle, { backgroundColor: colors.PRIMARY }, isDisabled && styles.actionCircleDisabled]}
        onPress={onMicPress}
        disabled={isDisabled}
      >
        <Image source={MIC_ICON} style={styles.micIcon} resizeMode="contain" />
      </Pressable>
    );
  };

  return (
    <View style={[styles.inputShell, { paddingBottom: getSafeAreaBottom(insets, 86) }]}> 
      <View style={[styles.inputInner, { backgroundColor: glassBg, borderColor: colors.CHAT_BORDER, shadowColor: colors.PRIMARY }]}> 
        <View style={styles.inputSparkle}>
          <Ionicons name="sparkles" size={16} color={colors.PRIMARY} />
        </View>

        <TextInput
          style={[styles.input, { color: colors.CHAT_TEXT }, isDisabled && styles.inputDisabled]}
          placeholder={placeholder}
          placeholderTextColor={colors.CHAT_MUTED}
          value={value}
          onChangeText={isDisabled ? undefined : onChangeText}
          editable={!isDisabled}
          selectTextOnFocus={!isDisabled}
          multiline
        />

        {renderRightAction()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputShell: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 16
  },
  inputInner: {
    minHeight: 52,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 28,
    borderWidth: 1,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3
  },
  inputSparkle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 6,
    paddingVertical: Platform.OS === "ios" ? 8 : 4,
    maxHeight: 80
  },
  inputDisabled: {
    opacity: 0.6
  },
  actionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  actionCircleDisabled: {
    backgroundColor: COLORS.CHAT_MUTED
  },
  micIcon: {
    width: 20,
    height: 20
  },
  actionCircleRecording: {
    backgroundColor: "#EF4444"
  },
  actionCircleStop: {
    backgroundColor: COLORS.EXPENSE
  }
});

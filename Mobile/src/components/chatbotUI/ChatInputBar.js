import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View, TextInput, Pressable, Platform, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";
import { COLORS, useAppColors } from "../../constants/colors";
import { getSafeAreaBottom } from "../../utils/safeArea";

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

  const MicIcon = () => (
    <Svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke={COLORS.WHITE}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <Path d="M12 19v4" />
      <Path d="M8 23h8" />
    </Svg>
  );

  const WaveformIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={COLORS.WHITE}>
      <Rect x="6" y="7" width="3" height="10" rx="1.5" />
      <Rect x="10.5" y="4" width="3" height="16" rx="1.5" />
      <Rect x="15" y="7" width="3" height="10" rx="1.5" />
    </Svg>
  );

  const renderRightAction = () => {
    if (loading && onStop) {
      return (
        <Pressable
          style={[styles.actionCircle, styles.actionCircleStop]}
          onPress={onStop}
          accessibilityRole="button"
          accessibilityLabel="Dừng tạo phản hồi"
        >
          <Svg width={14} height={14} viewBox="0 0 24 24" fill={COLORS.WHITE}>
            <Rect x="4" y="4" width="16" height="16" rx="2" />
          </Svg>
        </Pressable>
      );
    }

    if (hasText) {
      return (
        <Pressable
          style={[styles.actionCircle, isDisabled && styles.actionCircleDisabled]}
          onPress={onSend}
          disabled={isDisabled}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill={COLORS.WHITE}>
            <Path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
          </Svg>
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
            <WaveformIcon />
          </Pressable>
        </Animated.View>
      );
    }

    return (
      <Pressable
        style={[styles.actionCircle, isDisabled && styles.actionCircleDisabled]}
        onPress={onMicPress}
        disabled={isDisabled}
      >
        <MicIcon />
      </Pressable>
    );
  };

  return (
    <View style={[styles.inputShell, { paddingBottom: getSafeAreaBottom(insets, 86) }]}> 
      <View style={[styles.inputInner, { backgroundColor: colors.CHAT_BUBBLE, borderColor: colors.CHAT_BORDER, shadowColor: colors.PRIMARY }]}> 
        <View style={styles.inputSparkle}>
          <Text style={styles.inputSparkleText}>✦</Text>
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
    paddingHorizontal: 6,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderWidth: 1,
    borderColor: "rgba(239, 94, 131, 0.18)",
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 4
  },
  inputSparkle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  inputSparkleText: {
    fontSize: 16,
    color: COLORS.PRIMARY
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.CHAT_TEXT,
    paddingHorizontal: 6,
    paddingVertical: Platform.OS === "ios" ? 8 : 4,
    maxHeight: 80
  },
  inputDisabled: {
    color: COLORS.CHAT_MUTED
  },
  actionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.PRIMARY
  },
  actionCircleDisabled: {
    backgroundColor: COLORS.CHAT_MUTED
  },
  actionCircleRecording: {
    backgroundColor: "#EF4444"
  },
  actionCircleStop: {
    backgroundColor: COLORS.EXPENSE
  }
});

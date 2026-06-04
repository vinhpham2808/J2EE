import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { COLORS } from "../../constants/colors";

export default function OtpInput({ otp, inputRefs, onChange, onKeyDown }) {
  return (
    <View style={styles.otpRow}>
      {otp.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
          value={digit}
          onChangeText={(value) => onChange(index, value)}
          onKeyPress={({ nativeEvent }) => onKeyDown(index, nativeEvent.key)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: COLORS.DARK_INPUT_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.DARK_BORDER,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.DARK_TEXT,
  },
  otpInputFilled: {
    borderColor: COLORS.PRIMARY,
    borderWidth: 2,
  },
});

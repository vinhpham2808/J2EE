import React, { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { COLORS } from "../../constants/colors";

export default function OtpInput({ otp, inputRefs, onChange, onKeyDown }) {
  const [focusedIndex, setFocusedIndex] = useState(null);

  return (
    <View style={styles.otpRow}>
      {otp.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          style={[
            styles.otpInput,
            digit ? styles.otpInputFilled : null,
            focusedIndex === index ? styles.otpInputFocused : null
          ]}
          value={digit}
          onChangeText={(value) => onChange(index, value)}
          onKeyPress={({ nativeEvent }) => onKeyDown(index, nativeEvent.key)}
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex(null)}
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
    backgroundColor: "#FFFFFF", // Light background
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB", // Light border
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937", // Dark text color for readability
  },
  otpInputFilled: {
    borderColor: COLORS.PRIMARY,
    borderWidth: 1.5,
  },
  otpInputFocused: {
    borderColor: COLORS.PRIMARY,
    borderWidth: 2,
    backgroundColor: "#FFFFFF", // Light background on focus
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

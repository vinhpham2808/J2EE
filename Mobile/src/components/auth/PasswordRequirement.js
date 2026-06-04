import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";

function RequirementItem({ met, label }) {
  return (
    <View style={styles.requirementRow}>
      <Text style={[styles.requirementBullet, met && styles.requirementBulletMet]}>●</Text>
      <Text style={[styles.requirementText, met && styles.requirementTextMet]}>{label}</Text>
    </View>
  );
}

/**
 * @param {object} props
 * @param {{ hasNumber, hasUppercase, hasLowercase, hasSpecial, hasMinLength, notTooLong }} props.req - from validatePasswordRequirements
 * @param {{ notTooLong, noPersonalInfo }} [props.extraMet] - extra "must not contain" checks
 */
export default function PasswordRequirement({ req, extraMet }) {
  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.title}>Phải chứa ít nhất</Text>
          <RequirementItem met={req.hasNumber} label="1 số" />
          <RequirementItem met={req.hasUppercase} label="1 chữ hoa" />
          <RequirementItem met={req.hasLowercase} label="1 chữ thường" />
          <RequirementItem met={req.hasSpecial} label="1 ký tự đặc biệt" />
          <RequirementItem met={req.hasMinLength} label="8 ký tự" />
        </View>
        <View style={styles.col}>
          <Text style={styles.title}>Không được chứa</Text>
          <RequirementItem
            met={extraMet ? extraMet.notTooLong : req.notTooLong}
            label="Hơn 256 ký tự"
          />
          {extraMet?.noPersonalInfo !== undefined && (
            <RequirementItem met={extraMet.noPersonalInfo} label="Tên hoặc email của bạn" />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  col: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    color: COLORS.DARK_TEXT_SECONDARY,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  requirementBullet: {
    fontSize: 8,
    color: COLORS.DARK_TEXT_SECONDARY,
    marginRight: 8,
    width: 12,
  },
  requirementBulletMet: {
    color: COLORS.INCOME,
  },
  requirementText: {
    color: COLORS.DARK_TEXT_SECONDARY,
    fontSize: 12,
  },
  requirementTextMet: {
    color: COLORS.DARK_TEXT,
  },
});

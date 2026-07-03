import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { COLORS, useAppColors } from "../../constants/colors";

function RequirementItem({ met, label }) {
  const colors = useAppColors();
  return (
    <View style={styles.requirementRow}>
      <Text
        style={[
          styles.requirementBullet,
          { color: colors.TEXT_SECONDARY },
          met && styles.requirementBulletMet,
        ]}
      >
        ●
      </Text>
      <Text
        style={[
          styles.requirementText,
          { color: colors.TEXT_SECONDARY },
          met && [styles.requirementTextMet, { color: colors.TEXT }],
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

/**
 * @param {object} props
 * @param {{ hasNumber, hasUppercase, hasLowercase, hasSpecial, hasMinLength, notTooLong }} props.req - from validatePasswordRequirements
 * @param {{ notTooLong, noPersonalInfo }} [props.extraMet] - extra "must not contain" checks
 */
export default function PasswordRequirement({ req, extraMet }) {
  const { t } = useTranslation();
  const colors = useAppColors();

  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={[styles.title, { color: colors.TEXT }]}>
            {t("auth.password.mustContain")}
          </Text>
          <RequirementItem met={req.hasNumber} label={t("auth.password.oneNumber")} />
          <RequirementItem met={req.hasUppercase} label={t("auth.password.oneUppercase")} />
          <RequirementItem met={req.hasLowercase} label={t("auth.password.oneLowercase")} />
          <RequirementItem met={req.hasSpecial} label={t("auth.password.oneSpecial")} />
          <RequirementItem met={req.hasMinLength} label={t("auth.password.eightChars")} />
        </View>
        <View style={styles.col}>
          <Text style={[styles.title, { color: colors.TEXT }]}>
            {t("auth.password.mustNotContain")}
          </Text>
          <RequirementItem
            met={extraMet ? extraMet.notTooLong : req.notTooLong}
            label={t("auth.password.over256")}
          />
          {extraMet?.noPersonalInfo !== undefined && (
            <RequirementItem met={extraMet.noPersonalInfo} label={t("auth.password.personalInfo")} />
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

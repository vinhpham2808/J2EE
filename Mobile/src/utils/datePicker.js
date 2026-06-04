import React, { useState, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import DateTimePicker, { useDefaultStyles } from "react-native-ui-datepicker";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { todayIso } from "./format";
import { COLORS, useAppColors } from "../constants/colors";

dayjs.extend(customParseFormat);

// ─── Utility: ISO ↔ Date ────────────────────────────────────
const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function pad2(num) {
  return String(num).padStart(2, "0");
}

function parseDate(value) {
  if (!value || !ISO_PATTERN.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function formatDateToIso(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return todayIso();
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function normalizeIsoDate(value, fallback = todayIso()) {
  const parsed = parseDate(value);
  return parsed ? formatDateToIso(parsed) : fallback;
}

export function isIsoDate(value) {
  return Boolean(parseDate(value));
}

// ─── DatePickerModal (internal) ──────────────────────────────

/**
 * Bottom-sheet modal wrapping react-native-ui-datepicker.
 * Styled to match the app's warm rose-gold / pastel theme.
 */
function DatePickerModal({
  visible,
  value,
  onConfirm,
  onCancel,
  minimumDate,
  maximumDate
}) {
  const [draft, setDraft] = useState(value ? dayjs(value) : dayjs());
  const slideAnim = useRef(new Animated.Value(0)).current;
  const defaultStyles = useDefaultStyles();

  React.useEffect(() => {
    if (visible) {
      setDraft(value ? dayjs(value) : dayjs());
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 18,
        bounciness: 6
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [visible]);

  const handleConfirm = () => {
    const iso = draft.format("YYYY-MM-DD");
    const parsed = parseDate(iso);

    if (minimumDate) {
      const minParsed = parseDate(minimumDate);
      if (minParsed && parsed && parsed < minParsed) return;
    }
    if (maximumDate) {
      const maxParsed = parseDate(maximumDate);
      if (maxParsed && parsed && parsed > maxParsed) return;
    }

    onConfirm?.(iso);
  };

  const scaleAnim = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
    extrapolate: "clamp"
  });

  const opacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: "clamp"
  });

  // Custom styles — dark mode theme for calendar
  const themeStyles = {
    ...defaultStyles,
    selected: {
      backgroundColor: COLORS.PRIMARY,
      borderRadius: 14,
      shadowColor: COLORS.PRIMARY,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3
    },
    selected_label: {
      color: COLORS.WHITE,
      fontWeight: "800",
      fontSize: 15
    },
    today: {
      borderColor: COLORS.PRIMARY,
      borderWidth: 1.5,
      borderRadius: 14
    },
    today_label: {
      color: COLORS.PRIMARY,
      fontWeight: "700"
    },
    day: {
      borderRadius: 14,
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center"
    },
    day_label: {
      fontSize: 14,
      fontWeight: "500",
      color: "#FFFFFF"
    },
    day_outside: {
      borderRadius: 14
    },
    day_outside_label: {
      color: "#666666"
    },
    disabled: {
      opacity: 0.35
    },
    header: {
      marginBottom: 12
    },
    button_prev: {
      backgroundColor: "transparent",
      borderRadius: 12,
      borderWidth: 0,
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center"
    },
    button_next: {
      backgroundColor: "transparent",
      borderRadius: 12,
      borderWidth: 0,
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center"
    },
    button_prev_image: {
      tintColor: "#FFFFFF"
    },
    button_next_image: {
      tintColor: "#FFFFFF"
    },
    weekdays: {
      marginBottom: 6,
      paddingHorizontal: 2
    },
    weekday_label: {
      fontSize: 12,
      fontWeight: "700",
      color: "#A1A1AA",
      textTransform: "uppercase"
    },
    month_selector_label: {
      fontSize: 16,
      fontWeight: "700",
      color: "#FFFFFF",
      textTransform: "uppercase"
    },
    month_label: {
      fontSize: 16,
      fontWeight: "500",
      color: "#FFFFFF"
    },
    month_selector_selected_label: {
      color: COLORS.PRIMARY,
      fontWeight: "800"
    },
    year_selector_label: {
      fontSize: 16,
      fontWeight: "500",
      color: "#FFFFFF"
    },
    year_label: {
      fontSize: 16,
      fontWeight: "500",
      color: "#FFFFFF"
    },
    year_selector_selected_label: {
      color: COLORS.PRIMARY,
      fontWeight: "800"
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <Animated.View
          style={[
            styles.modalSheet,
            {
              transform: [{ scale: scaleAnim }],
              opacity
            }
          ]}
        >
          {/* Calendar */}
          <View style={styles.calendarWrap}>
            <DateTimePicker
              mode="single"
              date={draft}
              onChange={({ date }) => {
                if (date) setDraft(dayjs(date));
              }}
              minDate={minimumDate ? dayjs(minimumDate) : undefined}
              maxDate={maximumDate ? dayjs(maximumDate) : undefined}
              locale="vi"
              firstDayOfWeek={1}
              weekdaysFormat="min"
              monthsFormat="short"
              styles={themeStyles}
              containerStyle={styles.calendarInner}
            />
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </Pressable>
            <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>Xác nhận</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── PickDateField (public API — unchanged) ──────────────────

/**
 * Public API: pressable date field → opens styled bottom-sheet modal.
 *
 * Props:
 * - label: string (optional)
 * - value: ISO date "YYYY-MM-DD"
 * - onChange: (iso: string) => void
 * - placeholder: string
 * - minimumDate: ISO string
 * - maximumDate: ISO string
 */
export function PickDateField({
  label,
  value,
  onChange,
  placeholder = "YYYY-MM-DD",
  minimumDate,
  maximumDate
}) {
  const colors = useAppColors();
  const [visible, setVisible] = useState(false);
  const displayValue = value || placeholder;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 36,
      bounciness: 8
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 36,
      bounciness: 8
    }).start();
  };

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { color: colors.TEXT }]}>{label}</Text> : null}

      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          style={[styles.field, { backgroundColor: colors.CARD, borderColor: colors.CARD_BORDER }]}
          onPress={() => setVisible(true)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={[styles.fieldText, { color: value ? colors.TEXT : colors.TEXT_MUTED }]}>
            {displayValue}
          </Text>
          <Text style={styles.calendarIcon}>📅</Text>
        </Pressable>
      </Animated.View>

      <DatePickerModal
        visible={visible}
        value={value}
        onConfirm={(iso) => {
          onChange?.(iso);
          setVisible(false);
        }}
        onCancel={() => setVisible(false)}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const SCREEN_WIDTH = Dimensions.get("window").width;

const styles = StyleSheet.create({
  // Field (pressable input)
  wrapper: {
    marginBottom: 10
  },
  label: {
    color: COLORS.TEXT,
    marginBottom: 6,
    fontWeight: "600"
  },
  field: {
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  fieldText: {
    color: COLORS.TEXT,
    fontSize: 15
  },
  fieldPlaceholder: {
    color: COLORS.TEXT_MUTED
  },
  calendarIcon: {
    fontSize: 18
  },

  // Modal (dialog center)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center"
  },
  modalSheet: {
    backgroundColor: "#1c1c1f", // Dark background
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    width: Dimensions.get("window").width - 32,
    maxHeight: Dimensions.get("window").height * 0.82,
    shadowColor: "#c20d0d",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 14
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.TEXT,
    textAlign: "center",
    marginBottom: 16
  },
  calendarWrap: {
    alignItems: "center",
    marginBottom: 20
  },
  calendarInner: {
    width: SCREEN_WIDTH - 56,
    maxWidth: 400
  },

  // Action buttons
  actionRow: {
    flexDirection: "row",
    gap: 12
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#333333",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: "#2C2C2E"
  },
  cancelBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    shadowColor: COLORS.PRIMARY,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3
  },
  confirmBtnText: {
    color: COLORS.WHITE,
    fontWeight: "800",
    fontSize: 15
  }
});

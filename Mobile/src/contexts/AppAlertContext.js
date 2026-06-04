import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert as NativeAlert,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  APP_ALERT_VARIANTS,
  DEFAULT_ALERT_BUTTON_TEXT,
  DEFAULT_ALERT_TITLE,
  resolveAlertVariant
} from "../constants/appAlertConfig";
import { COLORS } from "../constants/colors";

const originalAlert = NativeAlert.alert.bind(NativeAlert);
let presenter = null;

function normalizeButtons(buttons) {
  if (!Array.isArray(buttons) || buttons.length === 0) {
    return [{ text: DEFAULT_ALERT_BUTTON_TEXT, style: "default" }];
  }

  return buttons
    .filter(Boolean)
    .map((button) => ({
      ...button,
      text: button.text || DEFAULT_ALERT_BUTTON_TEXT,
      style: button.style || "default"
    }));
}

function createAlertConfig(title, message, buttons, options) {
  const normalizedButtons = normalizeButtons(buttons);

  return {
    title: title || DEFAULT_ALERT_TITLE,
    message: message || "",
    buttons: normalizedButtons,
    options: options || {},
    variant: resolveAlertVariant(title, message, normalizedButtons)
  };
}

function showAlert(title, message, buttons, options) {
  const config = createAlertConfig(title, message, buttons, options);

  if (presenter) {
    presenter(config);
    return;
  }

  originalAlert(title, message, buttons, options);
}

NativeAlert.alert = showAlert;

export function AppAlertProvider({ children }) {
  const insets = useSafeAreaInsets();
  const [alertConfig, setAlertConfig] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  const openAlert = useCallback((config) => {
    setAlertConfig(config);
  }, []);

  useEffect(() => {
    presenter = openAlert;

    return () => {
      if (presenter === openAlert) {
        presenter = null;
      }
    };
  }, [openAlert]);

  useEffect(() => {
    if (!alertConfig) return;

    fadeAnim.setValue(0);
    scaleAnim.setValue(0.92);
    slideAnim.setValue(18);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 190,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 110,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 210,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]).start();
  }, [alertConfig, fadeAnim, scaleAnim, slideAnim]);

  const dismissAlert = useCallback(
    (button, shouldCallDismiss = false) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 130,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true
      }).start(() => {
        const onDismiss = alertConfig?.options?.onDismiss;
        setAlertConfig(null);
        button?.onPress?.();

        if (shouldCallDismiss) {
          onDismiss?.();
        }
      });
    },
    [alertConfig, fadeAnim]
  );

  const closeFromBackdrop = useCallback(() => {
    if (!alertConfig || alertConfig.options?.cancelable === false) return;

    const cancelButton = alertConfig.buttons.find((button) => button.style === "cancel");
    dismissAlert(cancelButton, true);
  }, [alertConfig, dismissAlert]);

  const actionButtons = useMemo(() => alertConfig?.buttons || [], [alertConfig]);
  const variant = alertConfig?.variant || "info";
  const visual = APP_ALERT_VARIANTS[variant] || APP_ALERT_VARIANTS.info;

  return (
    <>
      {children}

      <Modal
        visible={Boolean(alertConfig)}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeFromBackdrop}
      >
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
              paddingTop: Math.max(insets.top, 20),
              paddingBottom: Math.max(insets.bottom, 20)
            }
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeFromBackdrop} />

          {alertConfig ? (
            <Animated.View
              style={[
                styles.card,
                {
                  shadowColor: visual.accent,
                  transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
                }
              ]}
            >
              <View style={[styles.topBeam, { backgroundColor: visual.accent }]} />
              <View style={[styles.glowPanel, { backgroundColor: visual.glow }]} />

              <View style={styles.header}>
                <View style={[styles.iconShell, { borderColor: visual.accent }]}>
                  <View style={[styles.iconGlow, { backgroundColor: visual.soft }]}>
                    <View style={[styles.iconCircle, { backgroundColor: visual.accent }]}>
                      <Text style={styles.iconText}>{visual.icon}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.headerTextWrap}>
                  <Text style={[styles.variantLabel, { color: visual.accent }]} numberOfLines={1}>
                    {visual.label}
                  </Text>
                  <Text style={[styles.title, { color: visual.title }]} numberOfLines={2}>
                    {alertConfig.title}
                  </Text>
                </View>
              </View>

              {alertConfig.message ? (
                <Text style={styles.message}>{alertConfig.message}</Text>
              ) : null}

              <View style={[styles.actions, actionButtons.length > 1 && styles.actionsMulti]}>
                {actionButtons.map((button, index) => {
                  const isCancel = button.style === "cancel";
                  const isDestructive = button.style === "destructive";
                  const isPrimary = !isCancel && index === actionButtons.length - 1;
                  const buttonAccent = isDestructive ? APP_ALERT_VARIANTS.error.accent : visual.accent;
                  const buttonAccentDark = isDestructive ? APP_ALERT_VARIANTS.error.accentDark : visual.accentDark;

                  return (
                    <Pressable
                      key={`${button.text}-${index}`}
                      style={({ pressed }) => [
                        styles.actionButton,
                        actionButtons.length > 1 && styles.actionButtonMulti,
                        isCancel && styles.cancelButton,
                        (isPrimary || isDestructive) && {
                          backgroundColor: buttonAccent,
                          borderColor: buttonAccentDark
                        },
                        pressed && styles.buttonPressed
                      ]}
                      onPress={() => dismissAlert(button)}
                    >
                      <Text
                        style={[
                          styles.actionText,
                          isCancel && styles.cancelText,
                          (isPrimary || isDestructive) && styles.primaryText
                        ]}
                        numberOfLines={1}
                      >
                        {button.text}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          ) : null}
        </Animated.View>
      </Modal>
    </>
  );
}

export const AppAlert = {
  alert: showAlert
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(9, 6, 10, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20
  },
  card: {
    width: "100%",
    maxWidth: 390,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.34)",
    backgroundColor: COLORS.CARD,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: Platform.OS === "ios" ? 0.26 : 0.36,
    shadowRadius: 30,
    elevation: 24
  },
  topBeam: {
    height: 7
  },
  glowPanel: {
    position: "absolute",
    top: 7,
    left: 0,
    right: 0,
    height: 86
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 12
  },
  iconShell: {
    width: 72,
    height: 72,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14
  },
  iconGlow: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8
  },
  iconText: {
    color: COLORS.WHITE,
    fontSize: 24,
    fontWeight: "900"
  },
  headerTextWrap: {
    flex: 1
  },
  variantLabel: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 4
  },
  title: {
    fontSize: 21,
    fontWeight: "900",
    lineHeight: 26
  },
  message: {
    marginHorizontal: 20,
    marginTop: 2,
    color: COLORS.TEXT_SECONDARY,
    fontSize: 15,
    lineHeight: 22
  },
  actions: {
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20
  },
  actionsMulti: {
    flexDirection: "row",
    gap: 10
  },
  actionButton: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    backgroundColor: COLORS.BG,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14
  },
  actionButtonMulti: {
    flex: 1
  },
  cancelButton: {
    backgroundColor: COLORS.CARD,
    borderColor: COLORS.CARD_BORDER
  },
  actionText: {
    color: COLORS.TEXT,
    fontSize: 14,
    fontWeight: "900"
  },
  cancelText: {
    color: COLORS.TEXT_SECONDARY
  },
  primaryText: {
    color: COLORS.WHITE
  },
  buttonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }]
  }
});

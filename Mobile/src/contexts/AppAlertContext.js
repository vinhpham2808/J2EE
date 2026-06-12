import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert as NativeAlert,
  Animated,
  Easing,
  Image,
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
} from "../utils/appAlertConfig";
import { useAppColors } from "../constants/colors";

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
  const colors = useAppColors();
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
  const displayVisual = visual;
  const isDark = colors.BG === "#0F0D0C";
  const shouldStackActions = actionButtons.length > 2;

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
          <Pressable style={styles.backdrop} onPress={closeFromBackdrop} />

          {alertConfig ? (
            <Animated.View
              style={[
                styles.card,
                {
                  backgroundColor: colors.CARD,
                  borderColor: colors.CARD_BORDER,
                  shadowColor: displayVisual.accent,
                  transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
                }
              ]}
            >
              <View style={[styles.iconContainer, { backgroundColor: displayVisual.glow }]}>
                <Image source={displayVisual.image} style={styles.alertImage} resizeMode="contain" />
              </View>

              <Text style={[styles.title, { color: colors.TEXT }]} numberOfLines={2}>
                {alertConfig.title}
              </Text>

              {alertConfig.message ? (
                <Text style={[styles.message, { color: colors.TEXT_SECONDARY }]}>
                  {alertConfig.message}
                </Text>
              ) : null}

              <View style={[
                styles.actions,
                actionButtons.length > 1 && !shouldStackActions && styles.actionsMulti,
                shouldStackActions && styles.actionsStacked
              ]}>
                {actionButtons.map((button, index) => {
                  const isCancel = button.style === "cancel";
                  const isDestructive = button.style === "destructive";
                  const isImageAction = Boolean(button.image);
                  const isPrimary = !isImageAction && !isCancel && index === actionButtons.length - 1;
                  const buttonAccent = isDestructive ? APP_ALERT_VARIANTS.error.accent : displayVisual.accent;
                  const buttonAccentDark = isDestructive ? APP_ALERT_VARIANTS.error.accentDark : displayVisual.accentDark;

                  return (
                    <Pressable
                      key={`${button.text}-${index}`}
                      accessibilityLabel={button.accessibilityLabel || button.text}
                      style={({ pressed }) => [
                        styles.actionButton,
                        {
                          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : colors.BG,
                          borderColor: colors.CARD_BORDER,
                        },
                        actionButtons.length > 1 && !shouldStackActions && styles.actionButtonMulti,
                        shouldStackActions && styles.actionButtonStacked,
                        isCancel && { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : colors.CARD, borderColor: colors.CARD_BORDER },
                        (isPrimary || isDestructive) && {
                          backgroundColor: buttonAccent,
                          borderColor: buttonAccentDark
                        },
                        pressed && styles.buttonPressed
                      ]}
                      onPress={() => dismissAlert(button)}
                    >
                      {button.image ? (
                        <View style={styles.imageActionContent}>
                          <Image source={button.image} style={styles.actionImage} resizeMode="contain" />
                          <Text style={[styles.imageActionText, { color: colors.TEXT }]} numberOfLines={1}>
                            {button.text}
                          </Text>
                        </View>
                      ) : (
                        <Text
                          style={[
                            styles.actionText,
                            { color: colors.TEXT },
                            isCancel && { color: colors.TEXT_SECONDARY },
                            (isPrimary || isDestructive) && styles.primaryText
                          ]}
                          numberOfLines={1}
                        >
                          {button.text}
                        </Text>
                      )}
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
    backgroundColor: "rgba(0, 0, 0, 0.48)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  card: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 10
    },
    shadowOpacity: Platform.OS === "ios" ? 0.12 : 0.2,
    shadowRadius: 18,
    elevation: 8
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18
  },
  alertImage: {
    width: 38,
    height: 38
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 8
  },
  message: {
    width: "100%",
    minHeight: 0,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 26
  },
  actions: {
    width: "100%",
    gap: 12
  },
  actionsMulti: {
    flexDirection: "row",
    gap: 12
  },
  actionsStacked: {
    gap: 10
  },
  actionButton: {
    minHeight: 34,
    borderRadius: 0,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12
  },
  actionButtonMulti: {
    flex: 1
  },
  actionButtonStacked: {
    width: "100%"
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700"
  },
  actionImage: {
    width: 22,
    height: 22
  },
  imageActionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  imageActionText: {
    fontSize: 12,
    fontWeight: "700"
  },
  primaryText: {
    color: "#FFFFFF"
  },
  buttonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }]
  }
});

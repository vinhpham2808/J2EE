import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert as NativeAlert,
  Animated,
  Easing,
  Modal,
  Pressable,
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
import AppIcon from "../components/ui/AppIcon";
import styles from "./AppAlertStyles";

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
                  shadowColor: visual.accent,
                  transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
                }
              ]}
            >
              <View style={[styles.iconContainer, { backgroundColor: visual.accent, shadowColor: visual.accent }]}> 
                <AppIcon name={visual.icon} size={48} color="#FFFFFF" />
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
                  const isPrimary = !isCancel && index === actionButtons.length - 1;
                  const buttonAccent = isDestructive ? APP_ALERT_VARIANTS.error.accent : visual.accent;
                  const buttonAccentDark = isDestructive ? APP_ALERT_VARIANTS.error.accentDark : visual.accentDark;

                  return (
                    <Pressable
                      key={`${button.text}-${index}`}
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

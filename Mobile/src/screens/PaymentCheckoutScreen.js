import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import PaymentCheckoutFallback from "../components/Payment/PaymentCheckoutFallback";
import PaymentCheckoutHeader from "../components/Payment/PaymentCheckoutHeader";
import { COLORS } from "../constants/colors";
import usePaymentCheckoutFlow from "../hooks/usePaymentCheckoutFlow";
import { getSafeAreaBottom, getSafeAreaTop } from "../utils/safeAreaSpacing";

const PAYOS_MERCHANT_HEADER_HEIGHT = 56;

export default function PaymentCheckoutScreen() {
  const insets = useSafeAreaInsets();
  const checkout = usePaymentCheckoutFlow();

  if (!checkout.checkoutUrl) {
    return <PaymentCheckoutFallback onBackToPayment={checkout.goBackToPayment} />;
  }

  return (
    <View style={[styles.container, { paddingTop: getSafeAreaTop(insets), paddingBottom: getSafeAreaBottom(insets, 86) }]}>
      <PaymentCheckoutHeader
        canGoBack={checkout.canGoBack}
        onGoBack={checkout.goBackInWebView}
        title={checkout.title}
      />

      {checkout.isPageLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Đang tải cổng thanh toán...</Text>
        </View>
      ) : null}

      <View style={styles.checkoutFrame}>
        <WebView
          ref={checkout.webViewRef}
          style={styles.checkoutWebView}
          source={{ uri: checkout.checkoutUrl }}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          startInLoadingState
          onLoadStart={checkout.handleLoadStart}
          onLoadEnd={checkout.handleLoadEnd}
          onNavigationStateChange={checkout.handleNavigationStateChange}
          onShouldStartLoadWithRequest={checkout.handleShouldStartLoad}
          onError={checkout.handleWebViewError}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG
  },
  loadingOverlay: {
    position: "absolute",
    top: 100,
    left: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: "center",
    gap: 10
  },
  loadingText: {
    color: COLORS.TEXT,
    fontWeight: "600"
  },
  checkoutFrame: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: COLORS.CARD
  },
  checkoutWebView: {
    flex: 1,
    marginTop: -PAYOS_MERCHANT_HEADER_HEIGHT
  }
});

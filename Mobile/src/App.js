import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./contexts/AuthContext";
import { AppAlertProvider } from "./contexts/AppAlertContext";
import { configureGoogleSignin } from "./services/authGoogleService";
import AppNavigator from "./navigation/AppNavigator";

export default function App() {
  useEffect(() => {
    configureGoogleSignin();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppAlertProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </AppAlertProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./components/AuthContext";
import { AppAlertProvider } from "./components/AppAlert";
import { configureGoogleSignin } from "./services/googleAuth";
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

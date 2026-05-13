import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./components/AuthContext";
import { configureGoogleSignin } from "./services/googleAuth";
import AppNavigator from "./navigation/AppNavigator";

export default function App() {
  useEffect(() => {
    configureGoogleSignin();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
import React, { useContext, useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../components/AuthContext";
import LoadingScreen from "../components/LoadingScreen";
import MainTabs from "./MainTabs";
import { COLORS } from "../constants/colors";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import SetupProfileScreen from "../screens/CreateNameScreen";
import CreatePasswordScreen from "../screens/CreatePasswordScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ForgotPasswordOtpScreen from "../screens/ForgotPasswordOtpScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import VerifyOtpScreen from "../screens/VerifyOtpScreen";
import OnboardingScreen, { ONBOARDING_KEY } from "../screens/OnboardingScreen";

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ["moneymanager://"],
  config: {
    screens: {
      SettingTab: {
        screens: {
          Payment: "payment",
          PaymentResult: "payment/:result"
        }
      }
    }
  }
};

function AuthStack({ shouldShowOnboarding }) {
  return (
    <Stack.Navigator>
      {shouldShowOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
      ) : null}
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{
          title: "",
          headerTransparent: true,
          headerShadowVisible: false,
          headerBackVisible: false,
          headerBackTitleVisible: false,
          headerTintColor: COLORS.DARK_TEXT
        }}
      />
      <Stack.Screen
        name="VerifyOtp"
        component={VerifyOtpScreen}
        options={{
          title: "",
          headerTransparent: true,
          headerShadowVisible: false,
          headerBackVisible: false,
          headerBackTitleVisible: false,
        headerTintColor: COLORS.DARK_TEXT
        }}
      />
      <Stack.Screen
        name="SetupProfile"
        component={SetupProfileScreen}
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="CreatePassword"
        component={CreatePasswordScreen}
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          title: "",
          headerTransparent: true,
          headerShadowVisible: false,
          headerBackVisible: false,
          headerBackTitleVisible: false,
          headerTintColor: COLORS.DARK_TEXT
        }}
      />
      <Stack.Screen
        name="ForgotPasswordOtp"
        component={ForgotPasswordOtpScreen}
        options={{
          title: "",
          headerTransparent: true,
          headerShadowVisible: false,
          headerBackVisible: false,
          headerBackTitleVisible: false,
          headerTintColor: COLORS.DARK_TEXT
        }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{
          headerShown: false
        }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isBootstrapping } = useContext(AuthContext);
  const [isOnboardingResolved, setIsOnboardingResolved] = useState(false);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [isStartupDelayDone, setIsStartupDelayDone] = useState(false);

  useEffect(() => {
    let active = true;

    const resolveOnboarding = async () => {
      try {
        const onboardingDone = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (active) {
          setShouldShowOnboarding(onboardingDone !== "1");
          setIsOnboardingResolved(true);
        }
      } catch {
        if (active) {
          setShouldShowOnboarding(false);
          setIsOnboardingResolved(true);
        }
      }
    };

    resolveOnboarding();

    return () => {
      active = false;
    };
  }, []);

  const handleSplashComplete = () => {
    setIsStartupDelayDone(true);
  };

  if (isBootstrapping || !isOnboardingResolved || !isStartupDelayDone) {
    return <LoadingScreen onComplete={handleSplashComplete} />;
  }

  return (
    <NavigationContainer linking={linking}>
      {user ? <MainTabs /> : <AuthStack shouldShowOnboarding={shouldShowOnboarding} />}
    </NavigationContainer>
  );
}

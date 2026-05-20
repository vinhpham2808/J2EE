import React, { useContext, useEffect, useState } from "react";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../components/AuthContext";
import LoadingScreen from "../components/LoadingScreen";
import FloatingQuickMenu, { FloatingTabButton } from "./FloatingQuickMenu";
import { COLORS } from "../constants/colors";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import SetupProfileScreen from "../screens/CreateNameScreen";
import CreatePasswordScreen from "../screens/CreatePasswordScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ForgotPasswordOtpScreen from "../screens/ForgotPasswordOtpScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import VerifyOtpScreen from "../screens/VerifyOtpScreen";
import DashboardScreen from "../screens/DashboardScreen";
import ExpenseScreen from "../screens/ExpenseScreen";
import AddExpenseScreen from "../screens/AddExpenseScreen";
import IncomeScreen from "../screens/IncomeScreen";
import AddIncomeScreen from "../screens/AddIncomeScreen";
import BudgetScreen from "../screens/BudgetScreen";
import SavingGoalScreen from "../screens/SavingGoalScreen";
import MoreScreen from "../screens/MoreScreen";
import CategoryScreen from "../screens/CategoryScreen";
import FilterScreen from "../screens/FilterScreen";
import PaymentScreen from "../screens/PaymentScreen";
import PaymentCheckoutScreen from "../screens/PaymentCheckoutScreen";
import PaymentResultScreen from "../screens/PaymentResultScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import ForecastScreen from "../screens/ForecastScreen";
import ChatScreen from "../screens/ChatScreen";
import ReportsScreen from "../screens/ReportsScreen";
import OnboardingScreen, { ONBOARDING_KEY } from "../screens/OnboardingScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const linking = {
  prefixes: ["moneymanager://"],
  config: {
    screens: {
      Payment: "payment",
      PaymentResult: "payment/:result"
    }
  }
};

function EmptyScreen() {
  return null;
}

function MainTabs() {
  const navigation = useNavigation();
  const [isQuickMenuVisible, setIsQuickMenuVisible] = useState(false);

  const openExtraScreen = (routeName) => {
    setIsQuickMenuVisible(false);
    navigation.navigate(routeName);
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.TAB_ACTIVE,
          tabBarInactiveTintColor: COLORS.TAB_INACTIVE,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginBottom: 4
          },
          tabBarStyle: {
            height: 66,
            backgroundColor: COLORS.TAB_BG,
            borderTopColor: COLORS.TAB_BORDER
          },
          tabBarItemStyle: {
            flex: 1
          }
        }}
      >
        <Tab.Screen
          name="Home"
          component={DashboardScreen}
          options={{
            tabBarLabel: "Trang chủ",
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 17, marginTop: 4 }}>🏠</Text>
          }}
        />

        <Tab.Screen
          name="CategoryTab"
          component={CategoryScreen}
          options={{
            tabBarLabel: "Danh mục",
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 17, marginTop: 4 }}>📂</Text>
          }}
        />

        <Tab.Screen
          name="QuickActions"
          component={EmptyScreen}
          options={{
            tabBarLabel: "",
            tabBarIcon: () => null,
            tabBarButton: () => <FloatingTabButton onPress={() => setIsQuickMenuVisible(true)} />
          }}
        />

        <Tab.Screen
          name="ExpenseTab"
          component={ExpenseScreen}
          options={{
            tabBarLabel: "Chi tiêu",
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 17, marginTop: 4 }}>💸</Text>
          }}
        />

        <Tab.Screen
          name="SettingTab"
          component={MoreScreen}
          options={{
            tabBarLabel: "Hồ sơ",
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 17, marginTop: 4 }}>👤</Text>
          }}
        />
      </Tab.Navigator>

      <FloatingQuickMenu
        visible={isQuickMenuVisible}
        onClose={() => setIsQuickMenuVisible(false)}
        onSelectRoute={openExtraScreen}
      />
    </>
  );
}

function AppStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: "Thêm chi tiêu" }} />
      <Stack.Screen name="AddIncome" component={AddIncomeScreen} options={{ title: "Thêm thu nhập" }} />
      <Stack.Screen name="Income" component={IncomeScreen} options={{ title: "Thu nhập" }} />
      <Stack.Screen name="Budget" component={BudgetScreen} options={{ title: "Ngân sách" }} />
      <Stack.Screen name="SavingGoal" component={SavingGoalScreen} options={{ title: "Mục tiêu tiết kiệm" }} />
      <Stack.Screen name="More" component={MoreScreen} options={{ title: "Tiện ích khác" }} />
      <Stack.Screen name="Category" component={CategoryScreen} options={{ title: "Danh mục" }} />
      <Stack.Screen name="Filter" component={FilterScreen} options={{ title: "Lọc giao dịch" }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: "Thanh toán" }} />
      <Stack.Screen name="PaymentCheckout" component={PaymentCheckoutScreen} options={{ title: "Cổng thanh toán" }} />
      <Stack.Screen name="PaymentResult" component={PaymentResultScreen} options={{ title: "Kết quả thanh toán" }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Hồ sơ" }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: "Chỉnh sửa hồ sơ" }} />
      <Stack.Screen name="Forecast" component={ForecastScreen} options={{ title: "Dự báo & Bất thường" }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "Gemini AI Chat" }} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: "Báo cáo tháng" }} />
    </Stack.Navigator>
  );
}

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

  if (isBootstrapping || !isOnboardingResolved) {
    return <LoadingScreen text="Đang khởi tạo phiên đăng nhập..." />;
  }

  return (
    <NavigationContainer linking={linking}>
      {user ? <AppStack /> : <AuthStack shouldShowOnboarding={shouldShowOnboarding} />}
    </NavigationContainer>
  );
}

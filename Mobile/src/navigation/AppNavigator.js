import React, { useContext, useEffect, useState } from "react";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, Pressable, StyleSheet } from "react-native";
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
import ReceiptPreviewScreen from "../screens/ReceiptPreviewScreen";
import OnboardingScreen, { ONBOARDING_KEY } from "../screens/OnboardingScreen";
import JarScreen from "../screens/JarScreen";
import JarDetailScreen from "../screens/JarDetailScreen";
import JarFormScreen from "../screens/JarFormScreen";
import JarTransferScreen from "../screens/JarTransferScreen";

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

function PillTabButton({ children, onPress, accessibilityState }) {
  const focused = accessibilityState?.selected;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pillButton,
        (focused || pressed) && styles.pillButtonActive,
      ]}
      unstable_pressDelay={0}
    >
      {children}
    </Pressable>
  );
}

function MainTabs() {
  const navigation = useNavigation();
  const [isQuickMenuVisible, setIsQuickMenuVisible] = useState(false);

  const openExtraScreen = (routeName) => {
    setIsQuickMenuVisible(false);
    // Map Speed Dial keys to screen names
    const routeMap = {
      Income: "Income",
      Budget: "Budget",
      Forecast: "Forecast",
      AddExpense: "AddExpense",
      Chat: "Chat",
    };
    navigation.navigate(routeMap[routeName] || routeName);
  };

  const pillTabBarButton = (props) => <PillTabButton {...props} />;

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.TAB_ACTIVE,
          tabBarInactiveTintColor: COLORS.TAB_INACTIVE,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "600",
            marginBottom: 4,
          },
          tabBarStyle: {
            height: 70,
            backgroundColor: COLORS.TAB_BG,
            borderTopWidth: 1,
            borderTopColor: COLORS.TAB_BORDER,
            borderLeftWidth: 1,
            borderLeftColor: COLORS.TAB_BORDER,
            borderRightWidth: 1,
            borderRightColor: COLORS.TAB_BORDER,
            borderRadius: 20,
            marginHorizontal: 16,
            marginBottom: 8,
            paddingBottom: 6,
            position: "absolute",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          },
          tabBarItemStyle: {
            flex: 1,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={DashboardScreen}
          options={{
            tabBarLabel: "Home",
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 17, marginTop: 4 }}>🏠</Text>,
            tabBarButton: pillTabBarButton,
          }}
        />

        <Tab.Screen
          name="CategoryTab"
          component={CategoryScreen}
          options={{
            tabBarLabel: "Categories",
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 17, marginTop: 4 }}>📂</Text>,
            tabBarButton: pillTabBarButton,
          }}
        />

        <Tab.Screen
          name="QuickActions"
          component={EmptyScreen}
          options={{
            tabBarLabel: "",
            tabBarIcon: () => null,
            tabBarButton: () => (
              <FloatingTabButton
                isOpen={isQuickMenuVisible}
                onPress={() => setIsQuickMenuVisible((prev) => !prev)}
              />
            ),
          }}
        />

        <Tab.Screen
          name="ExpenseTab"
          component={ExpenseScreen}
          options={{
            tabBarLabel: "Expenses",
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 17, marginTop: 4 }}>💸</Text>,
            tabBarButton: pillTabBarButton,
          }}
        />

        <Tab.Screen
          name="SettingTab"
          component={MoreScreen}
          options={{
            tabBarLabel: "Profile",
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 17, marginTop: 4 }}>👤</Text>,
            tabBarButton: pillTabBarButton,
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
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "AI Chat" }} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: "Báo cáo tháng" }} />
      <Stack.Screen name="Jars" component={JarScreen} options={{ title: "Hũ chi tiêu" }} />
      <Stack.Screen name="JarDetail" component={JarDetailScreen} options={({ route }) => ({ title: route.params?.name || "Chi tiết hũ" })} />
      <Stack.Screen name="JarForm" component={JarFormScreen} options={{ title: "Thiết lập hũ" }} />
      <Stack.Screen name="JarTransfer" component={JarTransferScreen} options={{ title: "Chuyển tiền" }} />
      <Stack.Screen name="ReceiptPreview" component={ReceiptPreviewScreen} options={{ title: "Xem trước hóa đơn" }} />
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

const styles = StyleSheet.create({
  pillButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
    marginVertical: 6,
    borderRadius: 999,
    paddingHorizontal: 5,
    backgroundColor: "transparent",
  },
  pillButtonActive: {
    backgroundColor: COLORS.TAB_ACTIVE_BG,
    borderColor: "transparent",
  },
});

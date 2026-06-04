import React, { useState } from "react";
import { Text, Pressable, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppColors } from "../constants/colors";
import FloatingQuickMenu, { FloatingTabButton } from "./FloatingQuickMenu";
import DashboardScreen from "../screens/dashboard/DashboardScreen";
import CategoryScreen from "../screens/finance/CategoryScreen";
import ExpenseScreen from "../screens/finance/ExpenseScreen";
import MoreScreen from "../screens/profile/MoreScreen";
import IncomeScreen from "../screens/finance/IncomeScreen";
import BudgetScreen from "../screens/finance/BudgetScreen";
import GoalScreen from "../screens/finance/GoalScreen";
import ForecastScreen from "../screens/insights/ForecastScreen";
import ChatScreen from "../screens/insights/ChatScreen";
import ReportsScreen from "../screens/insights/ReportsScreen";
import JarScreen from "../screens/finance/JarScreen";
import ReceiptPreviewScreen from "../screens/finance/ReceiptPreviewScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import EditProfileScreen from "../screens/profile/EditProfileScreen";
import PaymentScreen from "../screens/payment/PaymentScreen";
import PaymentCheckoutScreen from "../screens/payment/PaymentCheckoutScreen";
import PaymentResultScreen from "../screens/payment/PaymentResultScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Empty placeholder for center FAB tab slot ──────────
function EmptyScreen() {
  return <View style={{ flex: 1 }} />;
}

function PillTabButton({ children, onPress, accessibilityState, suppressActive }) {
  const focused = accessibilityState?.selected && !suppressActive;
  const colors = useAppColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pillButton,
        (focused || pressed) && [styles.pillButtonActive, { backgroundColor: colors.TAB_ACTIVE_BG }],
      ]}
      unstable_pressDelay={0}
    >
      {children}
    </Pressable>
  );
}

// ─── Stack navigators for each tab ──────────────────────────

function TabLabel({ label, color }) {
  return (
    <Text
      style={[styles.tabLabel, { color }]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.72}
      allowFontScaling={false}
    >
      {label}
    </Text>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="AddExpense" component={ExpenseScreen} />
      <Stack.Screen name="AddIncome" component={IncomeScreen} />
      <Stack.Screen name="Income" component={IncomeScreen} />
      <Stack.Screen name="Budget" component={BudgetScreen} />
      <Stack.Screen name="Goal" component={GoalScreen} />
      <Stack.Screen name="Forecast" component={ForecastScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="Jars" component={JarScreen} />
      <Stack.Screen name="JarDetail" component={JarScreen} />
      <Stack.Screen name="JarForm" component={JarScreen} />
      <Stack.Screen name="JarTransfer" component={JarScreen} />
      <Stack.Screen name="ReceiptPreview" component={ReceiptPreviewScreen} />
    </Stack.Navigator>
  );
}

function CategoryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CategoryMain" component={CategoryScreen} />
    </Stack.Navigator>
  );
}

function ExpenseStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExpenseMain" component={ExpenseScreen} />
      <Stack.Screen name="AddExpense" component={ExpenseScreen} />
    </Stack.Navigator>
  );
}

function SettingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreMain" component={MoreScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="PaymentCheckout" component={PaymentCheckoutScreen} />
      <Stack.Screen name="PaymentResult" component={PaymentResultScreen} />
    </Stack.Navigator>
  );
}

// ─── Main Tabs ──────────────────────────────────────────────

export default function MainTabs() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const [isQuickMenuVisible, setIsQuickMenuVisible] = useState(false);
  const [suppressTabFocus, setSuppressTabFocus] = useState(false);
  const [floatingFocusedKey, setFloatingFocusedKey] = useState(null);

  const openExtraScreen = (routeName) => {
    setFloatingFocusedKey(routeName);
    setSuppressTabFocus(true);
    setIsQuickMenuVisible(false);
    const routeMap = {
      Income: "Income",
      Budget: "Budget",
      Forecast: "Forecast",
      Goal: "Goal",
      Chat: "Chat",
    };
    const screen = routeMap[routeName] || routeName;
    navigation.navigate("HomeTab", { screen });
  };

  const pillTabBarButton = (props) => {
    const originalOnPress = props.onPress;
    return (
      <PillTabButton
        {...props}
        suppressActive={suppressTabFocus}
        onPress={(e) => {
          setSuppressTabFocus(false);
          setFloatingFocusedKey(null);
          originalOnPress?.(e);
        }}
      />
    );
  };

  const fabTabBarButton = () => (
    <View style={styles.fabTabSlot}>
      <FloatingTabButton
        isOpen={isQuickMenuVisible}
        onPress={() => setIsQuickMenuVisible((prev) => !prev)}
      />
    </View>
  );

  // Override icon/label color when floating menu suppresses tab focus
  const tabColor = (focused, originalColor) =>
    focused && suppressTabFocus ? colors.TAB_INACTIVE : originalColor;

  const tabIcon = (emoji) => ({ focused, color }) => (
    <Text style={{ color: tabColor(focused, color), fontSize: 17, marginTop: 4 }}>{emoji}</Text>
  );

  const tabLabel = (label) => ({ focused, color }) => (
    <TabLabel label={label} color={tabColor(focused, color)} />
  );

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.TAB_ACTIVE,
          tabBarInactiveTintColor: colors.TAB_INACTIVE,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "600",
            marginBottom: 4,
          },
          tabBarStyle: {
            height: 70,
            backgroundColor: colors.TAB_BG,
            borderTopWidth: 1,
            borderTopColor: colors.TAB_BORDER,
            borderLeftWidth: 1,
            borderLeftColor: colors.TAB_BORDER,
            borderRightWidth: 1,
            borderRightColor: colors.TAB_BORDER,
            borderRadius: 20,
            marginHorizontal: 16,
            marginBottom: Math.max(insets.bottom, 8),
            paddingBottom: 6,
            position: "absolute",
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
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
          name="HomeTab"
          component={HomeStack}
          options={{
            tabBarLabel: tabLabel("Trang chủ"),
            tabBarIcon: tabIcon("🏠"),
            tabBarButton: pillTabBarButton,
          }}
        />

        <Tab.Screen
          name="CategoryTab"
          component={CategoryStack}
          options={{
            tabBarLabel: tabLabel("Danh mục"),
            tabBarIcon: tabIcon("📂"),
            tabBarButton: pillTabBarButton,
          }}
        />

        {/* Center FAB — occupies 5th slot, evenly spaced between tabs */}
        <Tab.Screen
          name="FabCenter"
          component={EmptyScreen}
          options={{
            tabBarLabel: () => null,
            tabBarIcon: () => null,
            tabBarButton: fabTabBarButton,
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setIsQuickMenuVisible((prev) => {
                if (prev) {
                  setFloatingFocusedKey(null);
                }
                return !prev;
              });
            },
          }}
        />

        <Tab.Screen
          name="ExpenseTab"
          component={ExpenseStack}
          options={{
            tabBarLabel: tabLabel("Chi tiêu"),
            tabBarIcon: tabIcon("💸"),
            tabBarButton: pillTabBarButton,
          }}
        />

        <Tab.Screen
          name="SettingTab"
          component={SettingStack}
          options={{
            tabBarLabel: tabLabel("Hồ sơ"),
            tabBarIcon: tabIcon("👤"),
            tabBarButton: pillTabBarButton,
          }}
        />
      </Tab.Navigator>

      <FloatingQuickMenu
        visible={isQuickMenuVisible}
        onClose={() => {
          setFloatingFocusedKey(null);
          setIsQuickMenuVisible(false);
        }}
        onSelectRoute={openExtraScreen}
        focusedKey={floatingFocusedKey}
      />
    </>
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
    borderColor: "transparent",
  },
  tabLabel: {
    width: "100%",
    maxWidth: 64,
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  fabTabSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

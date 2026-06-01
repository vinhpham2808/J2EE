import React, { useState } from "react";
import { Text, Pressable, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";
import FloatingQuickMenu, { FloatingTabButton } from "./FloatingQuickMenu";
import DashboardScreen from "../screens/DashboardScreen";
import CategoryScreen from "../screens/CategoryScreen";
import ExpenseScreen from "../screens/ExpenseScreen";
import MoreScreen from "../screens/MoreScreen";
import AddExpenseScreen from "../screens/AddExpenseScreen";
import AddIncomeScreen from "../screens/AddIncomeScreen";
import IncomeScreen from "../screens/IncomeScreen";
import BudgetScreen from "../screens/BudgetScreen";
import SavingGoalScreen from "../screens/SavingGoalScreen";
import ForecastScreen from "../screens/ForecastScreen";
import ChatScreen from "../screens/ChatScreen";
import ReportsScreen from "../screens/ReportsScreen";
import JarScreen from "../screens/JarScreen";
import JarDetailScreen from "../screens/JarDetailScreen";
import JarFormScreen from "../screens/JarFormScreen";
import JarTransferScreen from "../screens/JarTransferScreen";
import ReceiptPreviewScreen from "../screens/ReceiptPreviewScreen";
import FilterScreen from "../screens/FilterScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import PaymentScreen from "../screens/PaymentScreen";
import PaymentCheckoutScreen from "../screens/PaymentCheckoutScreen";
import PaymentResultScreen from "../screens/PaymentResultScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Empty placeholder for center FAB tab slot ──────────
function EmptyScreen() {
  return <View style={{ flex: 1 }} />;
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

const renderTabLabel = (label) => ({ color }) => (
  <TabLabel label={label} color={color} />
);

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
      <Stack.Screen name="AddIncome" component={AddIncomeScreen} />
      <Stack.Screen name="Income" component={IncomeScreen} />
      <Stack.Screen name="Budget" component={BudgetScreen} />
      <Stack.Screen name="SavingGoal" component={SavingGoalScreen} />
      <Stack.Screen name="Forecast" component={ForecastScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="Jars" component={JarScreen} />
      <Stack.Screen name="JarDetail" component={JarDetailScreen} />
      <Stack.Screen name="JarForm" component={JarFormScreen} />
      <Stack.Screen name="JarTransfer" component={JarTransferScreen} />
      <Stack.Screen name="ReceiptPreview" component={ReceiptPreviewScreen} />
    </Stack.Navigator>
  );
}

function CategoryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CategoryMain" component={CategoryScreen} />
      <Stack.Screen name="Filter" component={FilterScreen} />
    </Stack.Navigator>
  );
}

function ExpenseStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExpenseMain" component={ExpenseScreen} />
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
  const [isQuickMenuVisible, setIsQuickMenuVisible] = useState(false);

  const openExtraScreen = (routeName) => {
    setIsQuickMenuVisible(false);
    const routeMap = {
      Income: "Income",
      Budget: "Budget",
      Forecast: "Forecast",
      AddExpense: "AddExpense",
      Chat: "Chat",
    };
    const screen = routeMap[routeName] || routeName;
    navigation.navigate("HomeTab", { screen });
  };

  const pillTabBarButton = (props) => <PillTabButton {...props} />;

  const fabTabBarButton = () => (
    <View style={styles.fabTabSlot}>
      <FloatingTabButton
        isOpen={isQuickMenuVisible}
        onPress={() => setIsQuickMenuVisible((prev) => !prev)}
      />
    </View>
  );

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
            marginBottom: Math.max(insets.bottom, 8),
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
          name="HomeTab"
          component={HomeStack}
          options={{
            tabBarLabel: renderTabLabel("Trang chủ"),
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 17, marginTop: 4 }}>🏠</Text>,
            tabBarButton: pillTabBarButton,
          }}
        />

        <Tab.Screen
          name="CategoryTab"
          component={CategoryStack}
          options={{
            tabBarLabel: renderTabLabel("Danh mục"),
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 17, marginTop: 4 }}>📂</Text>,
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
              setIsQuickMenuVisible((prev) => !prev);
            },
          }}
        />

        <Tab.Screen
          name="ExpenseTab"
          component={ExpenseStack}
          options={{
            tabBarLabel: renderTabLabel("Chi tiêu"),
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 17, marginTop: 4 }}>💸</Text>,
            tabBarButton: pillTabBarButton,
          }}
        />

        <Tab.Screen
          name="SettingTab"
          component={SettingStack}
          options={{
            tabBarLabel: renderTabLabel("Hồ sơ"),
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

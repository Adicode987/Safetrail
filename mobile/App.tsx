import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ApolloProvider } from "@apollo/client";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { apolloClient } from "./src/apollo";
import { useAuth } from "./src/store";
import { LoginScreen } from "./src/screens/LoginScreen";
import { SignUpScreen } from "./src/screens/SignUpScreen";
import { MeScreen } from "./src/screens/MeScreen";
import { ContactsScreen } from "./src/screens/ContactsScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { StartJourneyScreen } from "./src/screens/StartJourneyScreen";
import { AlertSentScreen } from "./src/screens/AlertSentScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import type {
  AuthStackParamList,
  MainTabParamList,
  MainStackParamList,
} from "./src/navigation";
import { colors } from "./src/theme";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

function TabsNavigator() {
  return (
    <MainTabs.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontWeight: "700" },
      }}
    >
      <MainTabs.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "SafeTrail" }}
      />
      <MainTabs.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{ title: "Contacts" }}
      />
      <MainTabs.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: "History" }}
      />
      <MainTabs.Screen
        name="Me"
        component={MeScreen}
        options={{ title: "Me" }}
      />
    </MainTabs.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontWeight: "700" },
        headerTintColor: colors.primary,
      }}
    >
      <MainStack.Screen
        name="Tabs"
        component={TabsNavigator}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name="StartJourney"
        component={StartJourneyScreen}
        options={{ title: "Start Journey", presentation: "modal" }}
      />
      <MainStack.Screen
        name="AlertSent"
        component={AlertSentScreen}
        options={{ title: "Alert", presentation: "modal" }}
      />
    </MainStack.Navigator>
  );
}

function Root() {
  const token = useAuth((s) => s.token);
  const loading = useAuth((s) => s.loading);
  const restore = useAuth((s) => s.restore);

  useEffect(() => {
    restore();
  }, [restore]);

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ApolloProvider client={apolloClient}>
        <StatusBar style="dark" />
        <Root />
      </ApolloProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});

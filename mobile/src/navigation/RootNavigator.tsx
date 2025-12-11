// src/navigation/RootNavigator.tsx
import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import RegisterScreen from "../screens/RegisterScreen";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";

export type RootStackParamList = {
  Register: undefined;
  Login: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const TOKEN_KEY = "token";

export function RootNavigator() {
  const [initialRouteName, setInitialRouteName] =
    useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
      console.log("ROOTNAV TOKEN:", token);
        setInitialRouteName(token ? "Home" : "Login");
      } catch (e) {
        console.warn("Failed to read token", e);
        setInitialRouteName("Login");
      }
    };

    checkAuth();
  }, []);


  
  if (!initialRouteName) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName}>
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: "Create Account" }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: "Login" }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Home" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

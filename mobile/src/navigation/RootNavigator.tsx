// src/navigation/RootNavigator.tsx
import "react-native-gesture-handler";
import React from "react";
import { ActivityIndicator, View, TouchableOpacity, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import RegisterScreen from "../screens/Register/RegisterScreen";
import LoginScreen from "../screens/Login/LoginScreen";
import ProfileScreen from "../screens/Profile/ProfileScreen";
import SearchScreen from "../screens/Search/SearchScreen";
import FollowersListScreen from "../screens/FollowersList/FollowersListScreen";
import FollowingListScreen from "../screens/FollowingList/FollowingListScreen";
import UserProfileScreen from "../screens/UserProfileScreen/UserProfileScreen";
import FeedScreen from "../screens/Feed/FeedScreen";
import SpotDetailsScreen from "../screens/SpotDetails/SpotDetailsScreen";
import EditSpotScreen from "../screens/EditSpot/EditSpotScreen";

import { supabase } from "../services/supabase/client";
import {
  SpotCreationProvider,
  useSpotCreation,
} from "../contexts/SpotCreationContext";

import type { RootStackParamList } from "./types";
import { navigationRef } from "./navigationRef";
import { useAuthSession } from "./hooks/useAuthSession";
import { BottomOverlay } from "./components/BottomOverlay";
import { FeedHeader } from "./components/FeedHeader";

const Stack = createNativeStackNavigator<RootStackParamList>();

function NavigatorContent() {
  const { session, booting } = useAuthSession();
  const [activeRoute, setActiveRoute] = React.useState<string>("Feed");
  const { isCreatingSpot, isEditingSpot } = useSpotCreation();

  if (booting) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={() => {
        const route = navigationRef.getCurrentRoute();
        if (route?.name) setActiveRoute(route.name);
      }}
    >
      <View style={{ flex: 1 }}>
        <Stack.Navigator>
          {session ? (
            <>
              <Stack.Screen
                name="Feed"
                component={FeedScreen}
                options={({ navigation }) => ({
                  headerShown: true,
                  headerShadowVisible: false,
                  header: () => (
                    <FeedHeader
                      onProfile={() => navigation.navigate("Profile")}
                    />
                  ),
                })}
              />

              <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                  title: "Profile",
                  headerShadowVisible: false,
                  headerBackTitle: "",
                  headerRight: () => (
                    <TouchableOpacity
                      onPress={async () => {
                        await supabase.auth.signOut();
                      }}
                      style={{ paddingHorizontal: 8, paddingVertical: 6 }}
                    >
                      <Text style={{ color: "red", fontWeight: "600" }}>
                        Logout
                      </Text>
                    </TouchableOpacity>
                  ),
                }}
              />

              <Stack.Screen
                name="UserProfile"
                component={UserProfileScreen}
                options={{
                  title: "Profile",
                  headerShadowVisible: false,
                }}
              />

              <Stack.Screen
                name="Search"
                component={SearchScreen}
                options={{
                  title: "Search",
                  headerShadowVisible: false,
                }}
              />

              <Stack.Screen
                name="Followers"
                component={FollowersListScreen}
                options={{
                  title: "Followers",
                  headerShadowVisible: false,
                }}
              />

              <Stack.Screen
                name="Following"
                component={FollowingListScreen}
                options={{
                  title: "Following",
                  headerShadowVisible: false,
                }}
              />

              <Stack.Screen
                name="SpotDetails"
                component={SpotDetailsScreen}
                options={{
                  title: "DateSpot",
                  headerShadowVisible: false,
                }}
              />

              <Stack.Screen
                name="EditSpot"
                component={EditSpotScreen}
                options={{
                  title: "Edit DateSpot",
                  headerShadowVisible: false,
                }}
              />
            </>
          ) : (
            <>
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{
                  title: "Login",
                  headerShadowVisible: false,
                }}
              />

              <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{
                  title: "Create Account",
                  headerShadowVisible: false,
                }}
              />
            </>
          )}
        </Stack.Navigator>

        {session && !isCreatingSpot && !isEditingSpot && (
          <BottomOverlay
            activeRoute={activeRoute}
            onGoHome={() => {
              if (navigationRef.isReady()) navigationRef.navigate("Feed");
            }}
            onSearch={() => {
              if (navigationRef.isReady()) navigationRef.navigate("Search");
            }}
            onGoProfile={() => {
              if (navigationRef.isReady()) navigationRef.navigate("Profile");
            }}
          />
        )}
      </View>
    </NavigationContainer>
  );
}

export function RootNavigator() {
  return (
    <SafeAreaProvider>
      <SpotCreationProvider>
        <NavigatorContent />
      </SpotCreationProvider>
    </SafeAreaProvider>
  );
}

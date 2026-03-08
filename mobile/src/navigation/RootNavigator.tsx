// src/navigation/RootNavigator.tsx
import "react-native-gesture-handler";
import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
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
import SpotDetailsScreen from "../screens/SpotDetails/SpotDetailsScreen";
import EditSpotScreen from "../screens/EditSpot/EditSpotScreen";
import SettingsScreen from "../screens/Settings/SettingsScreen";
import EditProfileScreen from "../screens/EditProfile/EditProfileScreen";
import FiltersScreen from "../screens/Filters/FiltersScreen";
import ProfileSetupScreen from "../screens/ProfileSetup/ProfileSetupScreen";

import {
  SpotCreationProvider,
  useSpotCreation,
} from "../contexts/SpotCreationContext";

import type { RootStackParamList } from "./types";
import { navigationRef } from "./navigationRef";
import { useAuthSession } from "./hooks/useAuthSession";
import { BottomOverlay } from "./components/BottomOverlay";
import { AppDrawerNavigator } from "./DrawerNavigator";
import LaunchSplashScreen from "../screens/LaunchSplash/LaunchSplashScreen";
import { supabase } from "../services/supabase/client";
import { AppBackButton } from "../components/navigation/AppBackButton";

const Stack = createNativeStackNavigator<RootStackParamList>();

function NavigatorContent() {
  const { session, booting } = useAuthSession();
  const [activeRoute, setActiveRoute] = React.useState<string>("Feed");
  const [showLaunchSplash, setShowLaunchSplash] = React.useState(true);
  const [checkingProfileSetup, setCheckingProfileSetup] = React.useState(false);
  const [profileSetupComplete, setProfileSetupComplete] = React.useState(true);
  const splashStartTimeRef = React.useRef(Date.now());
  const { isCreatingSpot, isEditingSpot } = useSpotCreation();
  const showBottomOverlay = activeRoute === "Feed" || activeRoute === "Search" || activeRoute === "Profile";

  React.useEffect(() => {
    if (booting || !showLaunchSplash) return;

    const elapsed = Date.now() - splashStartTimeRef.current;
    const remaining = Math.max(0, 1000 - elapsed);
    const timeout = setTimeout(() => setShowLaunchSplash(false), remaining);

    return () => clearTimeout(timeout);
  }, [booting, showLaunchSplash]);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!session?.user?.id) {
        if (!cancelled) {
          setCheckingProfileSetup(false);
          setProfileSetupComplete(true);
        }
        return;
      }

      setCheckingProfileSetup(true);
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("name,username")
          .eq("id", session.user.id)
          .maybeSingle();

        if (error) throw error;

        const name = (profile?.name ?? "").trim();
        const username = (profile?.username ?? "").trim().toLowerCase();
        const complete = !!name && /^[a-z0-9_]{3,20}$/.test(username);

        if (!cancelled) setProfileSetupComplete(complete);
      } catch (e) {
        console.error("Failed checking profile completeness:", e);
        if (!cancelled) setProfileSetupComplete(false);
      } finally {
        if (!cancelled) setCheckingProfileSetup(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session]);

  if (booting || showLaunchSplash || checkingProfileSetup) return <LaunchSplashScreen />;

  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={() => {
        const route = navigationRef.getCurrentRoute();
        if (route?.name) setActiveRoute(route.name);
      }}
    >
      <View style={{ flex: 1 }}>
        <Stack.Navigator
          screenOptions={({ navigation }) => ({
            headerBackVisible: false,
            headerLeft: () =>
              navigation.canGoBack() ? (
                <AppBackButton onPress={() => navigation.goBack()} compact />
              ) : null,
          })}
        >
          {session ? (
            <>
              {!profileSetupComplete ? (
                <Stack.Screen
                  name="ProfileSetup"
                  component={ProfileSetupScreen}
                  options={{
                    headerShown: false,
                    headerShadowVisible: false,
                    gestureEnabled: false,
                    headerBackVisible: false,
                  }}
                />
              ) : (
                <>
                  <Stack.Screen
                    name="Home"
                    component={AppDrawerNavigator}
                    options={{
                      headerShown: false,
                    }}
                  />

                  <Stack.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={({ navigation }) => ({
                      title: "Profile",
                      headerShadowVisible: false,
                      headerBackTitle: "",
                      headerRight: () => (
                        <TouchableOpacity
                          onPress={() => navigation.navigate("Settings")}
                          style={{ paddingHorizontal: 8, paddingVertical: 6 }}
                        >
                          <Text style={{ color: "#111", fontWeight: "600" }}>
                            Settings
                          </Text>
                        </TouchableOpacity>
                      ),
                    })}
                  />

                  <Stack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{
                      headerShown: false,
                    }}
                  />

                  <Stack.Screen
                    name="EditProfile"
                    component={EditProfileScreen}
                    options={{
                      headerShown: false,
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
                    name="Filters"
                    component={FiltersScreen}
                    options={{
                      title: "Filters",
                      headerShadowVisible: false,
                      headerBackTitle: "",
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
              )}
            </>
          ) : (
            <>
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{
                  headerShown: false,
                }}
              />
            </>
          )}
        </Stack.Navigator>

        {session && profileSetupComplete && !isCreatingSpot && !isEditingSpot && showBottomOverlay && (
          <BottomOverlay
            activeRoute={activeRoute}
            onGoHome={() => {
              if (navigationRef.isReady()) navigationRef.navigate("Home");
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








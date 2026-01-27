// src/navigation/RootNavigator.tsx
import "react-native-gesture-handler";
import React, { useEffect, useState, useCallback } from "react";
import { NavigationContainer, useFocusEffect } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  View,
  TouchableOpacity,
  Image,
  Text,
} from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import RegisterScreen from "../screens/RegisterScreen";
import LoginScreen from "../screens/LoginScreen";
import MapScreen from "../screens/Map/MapScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { supabase } from "../lib/supabase";
import {
  createNavigationContainerRef,
} from "@react-navigation/native";
import { BottomOverlay } from "./BottomOverlay";
import SearchScreen from "../screens/Search/SearchScreen";
import FollowersListScreen from "../screens/FollowersListScreen";
import FollowingListScreen from "../screens/FollowingListScreen";
import UserProfileScreen from "../screens/UserProfileScreen";
import { SpotCreationProvider, useSpotCreation } from "../contexts/SpotCreationContext";
import FeedScreen from "../screens/Feed/FeedScreen";
import SpotDetailsScreen from "../screens/SpotDetailsScreen";
import EditSpotScreen from "../screens/EditSpotScreen";

export type RootStackParamList = {
  Register: undefined;
  Login: undefined;
  Feed: undefined;
  Home: undefined;
  Profile: undefined;
  Search: undefined;
  Followers: { userId: string };
  Following: { userId: string };
  UserProfile: { userId: string };
  SpotDetails: { spotId: string };
  EditSpot: { spotId: string }; 
};


const Stack = createNativeStackNavigator<RootStackParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

function FeedHeader({ onProfile }: { onProfile: () => void }) {
  const insets = useSafeAreaInsets();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const loadAvatar = useCallback(async () => {
    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = userRes.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      // optional cache-bust if you use the same storage path (avatar.jpg)
      const url = data?.avatar_url ?? null;
      setAvatarUrl(url ? `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}` : null);
    } catch (e) {
      console.warn("Failed to load avatar", e);
      setAvatarUrl(null);
    }
  }, []);

  // Refresh whenever Home becomes active again (e.g. after changing avatar in Profile)
  useFocusEffect(
    useCallback(() => {
      loadAvatar();
    }, [loadAvatar])
  );


  return (
    <View style={{ paddingTop: insets.top, backgroundColor: "#fff" }}>
      <View
        style={{
          height: 48,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "600" }}>Feed</Text>

        <TouchableOpacity onPress={onProfile}>
          <Image
            source={
              avatarUrl
                ? { uri: avatarUrl }
                : require("../../assets/default-avatar.png")
            }
            style={{ width: 32, height: 32, borderRadius: 16 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function NavigatorContent() {
  const [session, setSession] = useState<any>(null);
  const [booting, setBooting] = useState(true);
  const [activeRoute, setActiveRoute] = useState<string>("Feed");
  const { isCreatingSpot, isEditingSpot } = useSpotCreation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setBooting(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

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
                  header: () => (
                    <FeedHeader onProfile={() => navigation.navigate("Profile")} />
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
                      style={{ marginRight: 12 }}
                    >
                      <Text style={{ color: "red", fontWeight: "600" }}>Logout</Text>
                    </TouchableOpacity>
                  ),
                }}
              />
              <Stack.Screen
                name="UserProfile"
                component={UserProfileScreen}
                options={{ title: "Profile" }}
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
                  headerShadowVisible: false
                }}
              />
              <Stack.Screen
                name="EditSpot"
                component={EditSpotScreen}
                options={{ 
                  title: "Edit DateSpot",
                  headerShadowVisible: false }}
              />
            </>
          ) : (
            <>
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ title: "Login" }}
              />
              <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{ title: "Create Account" }}
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
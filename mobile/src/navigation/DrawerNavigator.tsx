import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { createDrawerNavigator, type DrawerContentComponentProps, DrawerContentScrollView } from "@react-navigation/drawer";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FeedScreen from "../screens/Feed/FeedScreen";
import type { RootStackParamList } from "./types";
import { FeedHeader } from "./components/FeedHeader";
import { navStyles } from "./styles";

export type AppDrawerParamList = {
  Feed: undefined;
};

const Drawer = createDrawerNavigator<AppDrawerParamList>();
const DRAWER_ITEMS = ["Feed", "Map", "Users"] as const;

function AppDrawerContent(props: DrawerContentComponentProps) {
  const activeRoute = props.state.routeNames[props.state.index] as keyof AppDrawerParamList;
  const insets = useSafeAreaInsets();
  const parent = props.navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[navStyles.drawerContent, { paddingTop: insets.top + 6 }]}
    >
      <View style={navStyles.drawerHeaderRow}>
        <Text style={navStyles.drawerHeaderTitle}>Navigation</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Close navigation"
          style={navStyles.drawerCloseButton}
          onPress={() => props.navigation.closeDrawer()}
        >
          <Text style={navStyles.drawerCloseIcon}>X</Text>
        </TouchableOpacity>
      </View>

      {DRAWER_ITEMS.map((routeName) => {
        const isActive = routeName === "Feed" && activeRoute === "Feed";
        return (
          <TouchableOpacity
            key={routeName}
            accessibilityRole="button"
            style={[navStyles.drawerItem, isActive && navStyles.drawerItemActive]}
            onPress={() => {
              if (routeName === "Feed") {
                props.navigation.navigate("Feed");
              } else {
                parent?.navigate("Search", { screen: routeName });
              }
              props.navigation.closeDrawer();
            }}
          >
            <Text style={[navStyles.drawerItemText, isActive && navStyles.drawerItemTextActive]}>
              {routeName}
            </Text>
          </TouchableOpacity>
        );
      })}
    </DrawerContentScrollView>
  );
}

export function AppDrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Feed"
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={({ navigation, route }) => ({
        headerShadowVisible: false,
        title: route.name,
        headerLeft: () => (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open navigation"
            style={navStyles.menuButton}
            onPress={() => navigation.openDrawer()}
          >
            <Text style={navStyles.menuIcon}>{"\u2630"}</Text>
          </TouchableOpacity>
        ),
      })}
    >
      <Drawer.Screen
        name="Feed"
        component={FeedScreen}
        options={({ navigation }) => ({
          title: "Feed",
          header: () => (
            <FeedHeader
              onOpenDrawer={() => navigation.openDrawer()}
              onProfile={() => {
                const parent = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
                parent?.navigate("Profile");
              }}
            />
          ),
        })}
      />
    </Drawer.Navigator>
  );
}

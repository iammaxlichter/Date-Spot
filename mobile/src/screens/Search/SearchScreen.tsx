import React from "react";
import { View } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import UsersSearchScreen from "../UsersSearch/UsersSearchScreen";
import MapScreen from "../Map/MapScreen";
import { AppBackButton } from "../../components/navigation/AppBackButton";
import type { SearchTabParamList } from "../../navigation/types";

const Tab = createMaterialTopTabNavigator<SearchTabParamList>();

export default function SearchScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 12,
        }}
      >
        <AppBackButton onPress={() => navigation.goBack()} />
      </View>

      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: "#F2F2F2",
          },
          tabBarActiveTintColor: "#E21E4D",
          tabBarInactiveTintColor: "#9A9A9A",
          tabBarIndicatorStyle: {
            backgroundColor: "#E21E4D",
            height: 2,
          },
          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: "700",
            textTransform: "none",
          },
          tabBarPressColor: "#FDE7ED",
        }}
      >
        <Tab.Screen name="Map" component={MapScreen} options={{ tabBarLabel: "Date Spot Map" }} />
        <Tab.Screen name="Users" component={UsersSearchScreen} />
      </Tab.Navigator>
    </View>
  );
}

import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import UsersSearchScreen from "../UsersSearch/UsersSearchScreen";
import MapScreen from "../Map/MapScreen";

const Tab = createMaterialTopTabNavigator();

export default function SearchScreen() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Users" component={UsersSearchScreen} />
    </Tab.Navigator>
  );
}

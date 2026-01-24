import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import PlaceholderTab from "./tabs/PlaceholderTab";
import UsersTab from "./tabs/UsersTab";

const Tab = createMaterialTopTabNavigator();

export default function SearchScreen() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Placeholder" component={PlaceholderTab} />
      <Tab.Screen name="Users" component={UsersTab} />
    </Tab.Navigator>
  );
}

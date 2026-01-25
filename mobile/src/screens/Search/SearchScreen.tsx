import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import UsersTab from "./tabs/UsersTab";
import MapScreen from "../Map/MapScreen";

const Tab = createMaterialTopTabNavigator();

export default function SearchScreen() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Users" component={UsersTab} />
    </Tab.Navigator>
  );
}

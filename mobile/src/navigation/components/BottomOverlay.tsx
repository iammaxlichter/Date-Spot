// src/navigation/components/BottomOverlay.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { navStyles } from "../styles";

export function BottomOverlay(props: {
  activeRoute?: string;
  onGoHome: () => void;
  onSearch: () => void;
  onGoProfile: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { activeRoute, onGoHome, onSearch, onGoProfile } = props;

  const isHome = activeRoute === "Feed";
  const isProfile = activeRoute === "Profile";

  return (
    <View pointerEvents="box-none" style={navStyles.wrapper}>
      <View style={[navStyles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity style={navStyles.tab} onPress={onGoHome}>
          <Text style={[navStyles.tabText, isHome && navStyles.tabTextActive]}>
            Feed
          </Text>
        </TouchableOpacity>

        <View style={navStyles.centerWrap}>
          <TouchableOpacity style={navStyles.centerBtn} onPress={onSearch}>
            <Text style={navStyles.centerBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={navStyles.tab} onPress={onGoProfile}>
          <Text style={[navStyles.tabText, isProfile && navStyles.tabTextActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

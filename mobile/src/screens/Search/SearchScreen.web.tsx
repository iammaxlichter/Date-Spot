import React from "react";
import { Animated, LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import UsersSearchScreen from "../UsersSearch/UsersSearchScreen";
import { AppBackButton } from "../../components/navigation/AppBackButton";

type Tab = "Map" | "Users";
const TABS: Tab[] = ["Map", "Users"];
const INDICATOR_INSET = 16;

export default function SearchScreen() {
  const navigation = useNavigation();
  const route = useRoute() as { params?: { screen?: Tab } };
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState<Tab>(route.params?.screen ?? "Map");
  const [tabBarWidth, setTabBarWidth] = React.useState(0);
  const indicatorX = React.useRef(new Animated.Value(INDICATOR_INSET)).current;

  const activeIndex = TABS.indexOf(activeTab);
  const tabWidth = tabBarWidth > 0 ? tabBarWidth / TABS.length : 0;
  const indicatorWidth = Math.max(tabWidth - INDICATOR_INSET * 2, 0);

  const onTabBarLayout = React.useCallback((event: LayoutChangeEvent) => {
    setTabBarWidth(event.nativeEvent.layout.width);
  }, []);

  React.useEffect(() => {
    if (!tabWidth) return;
    Animated.spring(indicatorX, {
      toValue: activeIndex * tabWidth + INDICATOR_INSET,
      useNativeDriver: true,
      damping: 18,
      stiffness: 220,
    }).start();
  }, [activeIndex, indicatorX, tabWidth]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 28 }]}>
      <View style={styles.backRow}>
        <AppBackButton onPress={() => navigation.goBack()} />
      </View>

      <View style={styles.tabBar} onLayout={onTabBarLayout}>
        {indicatorWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.tabIndicator,
              {
                width: indicatorWidth,
                transform: [{ translateX: indicatorX }],
              },
            ]}
          />
        ) : null}

        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            activeOpacity={0.7}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab === "Map" ? "Date Spot Map" : "Users"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "Map" ? (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderIcon}>Bruh</Text>
          <Text style={styles.mapPlaceholderTitle}>Map unavailable on web</Text>
          <Text style={styles.mapPlaceholderSubtitle}>
            Open the app on iOS or Android to explore date spots on the map.
          </Text>
        </View>
      ) : (
        <UsersSearchScreen />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  backRow: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  tabBar: {
    position: "relative",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9A9A9A",
  },
  tabLabelActive: {
    color: "#E21E4D",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#E21E4D",
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  mapPlaceholderIcon: {
    fontSize: 48,
  },
  mapPlaceholderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D1D1D",
    textAlign: "center",
  },
  mapPlaceholderSubtitle: {
    fontSize: 14,
    color: "#9A9A9A",
    textAlign: "center",
    lineHeight: 20,
  },
});

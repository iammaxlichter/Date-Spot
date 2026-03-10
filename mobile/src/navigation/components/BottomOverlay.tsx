// src/navigation/components/BottomOverlay.tsx
import React from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DOT_WIDTH = 20;

const TABS = ["Feed", "Explore", "Profile"] as const;
type Tab = (typeof TABS)[number];

export function BottomOverlay(props: {
  activeRoute?: string;
  onGoHome: () => void;
  onSearch: () => void;
  onGoProfile: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { activeRoute, onGoHome, onSearch, onGoProfile } = props;

  const isHome = activeRoute === "Feed" || activeRoute === "Home";
  const isProfile = activeRoute === "Profile";
  const isExplore = !isHome && !isProfile;

  const activeTab: Tab = isProfile ? "Profile" : isExplore ? "Explore" : "Feed";

  const dotX = React.useRef(new Animated.Value(-999)).current;
  const tabCenters = React.useRef<Partial<Record<Tab, number>>>({});
  const measured = React.useRef<Partial<Record<Tab, boolean>>>({});
  const initialized = React.useRef(false);
  const activeTabRef = React.useRef<Tab>(activeTab);
  activeTabRef.current = activeTab;

  const moveDot = React.useCallback(
    (tab: Tab) => {
      const target = tabCenters.current[tab];
      if (target === undefined) return;
      Animated.spring(dotX, {
        toValue: target - DOT_WIDTH / 2,
        useNativeDriver: true,
        damping: 18,
        stiffness: 220,
      }).start();
    },
    [dotX]
  );

  const handleLayout = (tab: Tab) => (e: any) => {
    const { x, width } = e.nativeEvent.layout;
    tabCenters.current[tab] = x + width / 2;
    measured.current[tab] = true;

    const allMeasured = TABS.every((t) => measured.current[t]);
    if (!initialized.current && allMeasured) {
      initialized.current = true;
      const initial = tabCenters.current[activeTabRef.current]!;
      dotX.setValue(initial - DOT_WIDTH / 2);
    }
  };

  React.useEffect(() => {
    if (initialized.current) {
      moveDot(activeTab);
    }
  }, [activeTab, moveDot]);

  const onPress = (tab: Tab) => {
    if (tab === "Feed") props.onGoHome();
    else if (tab === "Explore") props.onSearch();
    else props.onGoProfile();
  };

  const isActive = (tab: Tab) => tab === activeTab;

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Animated.View style={[styles.dot, { transform: [{ translateX: dotX }] }]} />

        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            onLayout={handleLayout(tab)}
            onPress={() => onPress(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, isActive(tab) && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EFEFEF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  dot: {
    position: "absolute",
    top: 0,
    left: 0,
    width: DOT_WIDTH,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#E21E4D",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ADADAD",
  },
  tabTextActive: {
    color: "#1D1D1D",
    fontWeight: "700",
  },
});

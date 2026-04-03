// src/screens/FollowersList/FollowersListScreen.tsx
import React from "react";
import {
  View,
  Animated,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Text,
  Keyboard,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { styles } from "./styles";
import { useFollowersList } from "./hooks/useFollowersList";
import { useFollowingList } from "../FollowingList/hooks/useFollowingList";
import { FollowersSearchBar } from "./components/FollowersSearchBar";
import { FollowingSearchBar } from "../FollowingList/components/FollowingSearchBar";
import { FollowersErrorBanner } from "./components/FollowersErrorBanner";
import { FollowingErrorBanner } from "../FollowingList/components/FollowingErrorBanner";
import { FollowersRowItem } from "./components/FollowersRowItem";
import { FollowingRowItem } from "../FollowingList/components/FollowingRowItem";
import { AppBackButton } from "../../components/navigation/AppBackButton";

type Tab = "followers" | "following";

export default function FollowersListScreen({ route }: any) {
  const userId: string = route.params.userId;
  const initialTab: Tab = route.params?.initialTab ?? "followers";
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [activeTab, setActiveTab] = React.useState<Tab>(initialTab);
  const translateX = React.useRef(
    new Animated.Value(initialTab === "followers" ? 0 : -width)
  ).current;
  const indicatorX = React.useRef(
    new Animated.Value(initialTab === "followers" ? 0 : width / 2)
  ).current;

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    const toContent = tab === "followers" ? 0 : -width;
    const toIndicator = tab === "followers" ? 0 : width / 2;
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: toContent,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(indicatorX, {
        toValue: toIndicator,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const followers = useFollowersList({ userId, navigation });
  const following = useFollowingList({ userId, navigation });

  const [followersPullRefreshing, setFollowersPullRefreshing] = React.useState(false);
  const [followingPullRefreshing, setFollowingPullRefreshing] = React.useState(false);

  const handleFollowersPullRefresh = React.useCallback(async () => {
    setFollowersPullRefreshing(true);
    try { await followers.onRefresh(); } finally { setFollowersPullRefreshing(false); }
  }, [followers.onRefresh]);

  const handleFollowingPullRefresh = React.useCallback(async () => {
    setFollowingPullRefreshing(true);
    try { await following.onRefresh(); } finally { setFollowingPullRefreshing(false); }
  }, [following.onRefresh]);

  return (
    <Pressable style={styles.container} onPress={Keyboard.dismiss}>
      <View style={[styles.header, { paddingTop: insets.top + 28 }]}>
        <View style={styles.backButton}>
          <AppBackButton onPress={() => navigation.goBack()} />
        </View>

        <View style={styles.tabRow}>
          <Pressable style={styles.tab} onPress={() => switchTab("followers")}>
            <Text style={[styles.tabText, activeTab === "followers" && styles.tabTextActive]}>
              Followers
            </Text>
          </Pressable>
          <Pressable style={styles.tab} onPress={() => switchTab("following")}>
            <Text style={[styles.tabText, activeTab === "following" && styles.tabTextActive]}>
              Following
            </Text>
          </Pressable>
          <Animated.View
            style={[styles.tabIndicator, { transform: [{ translateX: indicatorX }] }]}
          />
        </View>

        {activeTab === "followers" ? (
          <>
            {followers.error ? <FollowersErrorBanner message={followers.error} /> : null}
            <FollowersSearchBar value={followers.searchQuery} onChange={followers.setSearchQuery} />
            {followers.refreshing && !followersPullRefreshing ? (
              <ActivityIndicator size="large" color="#E21E4D" style={styles.searchSpinner} />
            ) : null}
          </>
        ) : (
          <>
            {following.error ? <FollowingErrorBanner message={following.error} /> : null}
            <FollowingSearchBar value={following.searchQuery} onChange={following.setSearchQuery} />
            {following.refreshing && !followingPullRefreshing ? (
              <ActivityIndicator size="large" color="#E21E4D" style={styles.searchSpinner} />
            ) : null}
          </>
        )}
      </View>

      {/* Sliding pane — both lists live side-by-side, translateX shifts which is visible */}
      <View style={{ flex: 1, overflow: "hidden" }}>
        <Animated.View
          style={{
            flex: 1,
            flexDirection: "row",
            width: width * 2,
            transform: [{ translateX }],
          }}
        >
          {/* Followers pane */}
          <View style={{ width }}>
            <FlatList
              data={followers.rows}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              refreshControl={
                <RefreshControl
                  refreshing={followersPullRefreshing}
                  onRefresh={handleFollowersPullRefresh}
                  tintColor="#E21E4D"
                  titleColor="#E21E4D"
                  colors={["#E21E4D"]}
                  progressBackgroundColor="#FFFFFF"
                />
              }
              onEndReached={followers.handleLoadMore}
              onEndReachedThreshold={0.5}
              ListEmptyComponent={
                !followers.loading && !followers.refreshing ? (
                  <Text style={styles.emptyText}>
                    {followers.searchQuery.trim() ? "No followers found." : "No followers yet."}
                  </Text>
                ) : null
              }
              renderItem={({ item }) => (
                <FollowersRowItem
                  item={item}
                  currentUserId={followers.currentUserId}
                  viewedUserId={userId}
                  onPressProfile={followers.handleProfilePress}
                  onToggleFollow={followers.toggleFollowFromList}
                  onRemoveFollower={followers.removeFollower}
                />
              )}
            />
          </View>

          {/* Following pane */}
          <View style={{ width }}>
            <FlatList
              data={following.rows}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              refreshControl={
                <RefreshControl
                  refreshing={followingPullRefreshing}
                  onRefresh={handleFollowingPullRefresh}
                  tintColor="#E21E4D"
                  titleColor="#E21E4D"
                  colors={["#E21E4D"]}
                  progressBackgroundColor="#FFFFFF"
                />
              }
              onEndReached={following.handleLoadMore}
              onEndReachedThreshold={0.5}
              ListEmptyComponent={
                !following.loading && !following.refreshing ? (
                  <Text style={styles.emptyText}>
                    {following.searchQuery.trim() ? "No users found." : "Not following anyone yet."}
                  </Text>
                ) : null
              }
              renderItem={({ item }) => (
                <FollowingRowItem
                  item={item}
                  onPressProfile={following.handleProfilePress}
                  onToggleFollow={following.toggleFollowFromList}
                />
              )}
            />
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
}

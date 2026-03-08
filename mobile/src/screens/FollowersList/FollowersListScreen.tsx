// src/screens/FollowersList/FollowersListScreen.tsx
import React from "react";
import { View, FlatList, ActivityIndicator, RefreshControl, Text, Keyboard, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { styles } from "./styles";
import { useFollowersList } from "./hooks/useFollowersList";
import { FollowersSearchBar } from "./components/FollowersSearchBar";
import { FollowersErrorBanner } from "./components/FollowersErrorBanner";
import { FollowersRowItem } from "./components/FollowersRowItem";
import { AppBackButton } from "../../components/navigation/AppBackButton";

export default function FollowersListScreen({ route }: any) {
  const userId: string = route.params.userId; // profile you're viewing
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const {
    loading,
    refreshing,
    rows,
    error,
    searchQuery,
    setSearchQuery,
    onRefresh,
    handleLoadMore,
    handleProfilePress,
    toggleFollowFromList,
    removeFollower,
    currentUserId,
  } = useFollowersList({ userId, navigation });
  const [isPullRefreshing, setIsPullRefreshing] = React.useState(false);

  const handlePullRefresh = React.useCallback(async () => {
    setIsPullRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsPullRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <Pressable style={styles.container} onPress={Keyboard.dismiss}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.backButton}>
          <AppBackButton onPress={() => navigation.goBack()} />
        </View>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Social</Text>
          <Text style={styles.title}>Followers</Text>
          <Text style={styles.subtitle}>People following you.</Text>
        </View>
        {error && <FollowersErrorBanner message={error} />}
        <FollowersSearchBar value={searchQuery} onChange={setSearchQuery} />
        {refreshing && !isPullRefreshing ? (
          <ActivityIndicator size="large" color="#E21E4D" style={styles.searchSpinner} />
        ) : null}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={isPullRefreshing}
            onRefresh={handlePullRefresh}
            tintColor="#E21E4D"
            titleColor="#E21E4D"
            colors={["#E21E4D"]}
            progressBackgroundColor="#FFFFFF"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading && !refreshing ? (
            <Text style={styles.emptyText}>
              {searchQuery.trim() ? "No followers found." : "No followers yet."}
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <FollowersRowItem
            item={item}
            currentUserId={currentUserId}
            viewedUserId={userId}
            onPressProfile={handleProfilePress}
            onToggleFollow={toggleFollowFromList}
            onRemoveFollower={removeFollower}
          />
        )}
      />
    </Pressable>
  );
}

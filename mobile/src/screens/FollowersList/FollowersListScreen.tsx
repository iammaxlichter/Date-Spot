// src/screens/FollowersList/FollowersListScreen.tsx
import React from "react";
import { View, FlatList, ActivityIndicator, RefreshControl, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { styles } from "./styles";
import { useFollowersList } from "./hooks/useFollowersList";
import { FollowersSearchBar } from "./components/FollowersSearchBar";
import { FollowersErrorBanner } from "./components/FollowersErrorBanner";
import { FollowersRowItem } from "./components/FollowersRowItem";

export default function FollowersListScreen({ route }: any) {
  const userId: string = route.params.userId; // profile you're viewing
  const navigation = useNavigation<any>();

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

  if (loading && rows.length === 0 && !error) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FollowersSearchBar value={searchQuery} onChange={setSearchQuery} />

      {error && <FollowersErrorBanner message={error} />}

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {searchQuery.trim() ? "No followers found." : "No followers yet."}
          </Text>
        }
        ListFooterComponent={
          loading && rows.length > 0 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator />
            </View>
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
    </View>
  );
}

// src/screens/FollowingList/FollowingListScreen.tsx
import React from "react";
import { View, FlatList, ActivityIndicator, RefreshControl, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { styles } from "./styles";
import { useFollowingList } from "./hooks/useFollowingList";
import { FollowingSearchBar } from "./components/FollowingSearchBar";
import { FollowingErrorBanner } from "./components/FollowingErrorBanner";
import { FollowingRowItem } from "./components/FollowingRowItem";

export default function FollowingListScreen({ route }: any) {
  const userId: string = route.params.userId;
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
  } = useFollowingList({ userId, navigation });

  if (loading && rows.length === 0 && !error) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FollowingSearchBar value={searchQuery} onChange={setSearchQuery} />

      {error && <FollowingErrorBanner message={error} />}

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {searchQuery.trim() ? "No users found." : "Not following anyone yet."}
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
          <FollowingRowItem
            item={item}
            onPressProfile={handleProfilePress}
            onToggleFollow={toggleFollowFromList}
          />
        )}
      />
    </View>
  );
}

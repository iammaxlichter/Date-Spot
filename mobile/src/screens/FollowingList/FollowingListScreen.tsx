// src/screens/FollowingList/FollowingListScreen.tsx
import React from "react";
import { View, FlatList, ActivityIndicator, RefreshControl, Text, Keyboard, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { styles } from "./styles";
import { useFollowingList } from "./hooks/useFollowingList";
import { FollowingSearchBar } from "./components/FollowingSearchBar";
import { FollowingErrorBanner } from "./components/FollowingErrorBanner";
import { FollowingRowItem } from "./components/FollowingRowItem";
import { AppBackButton } from "../../components/navigation/AppBackButton";

export default function FollowingListScreen({ route }: any) {
  const userId: string = route.params.userId;
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
  } = useFollowingList({ userId, navigation });
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
      {/* Fixed header — never re-layouts when list state changes */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.backButton}>
          <AppBackButton onPress={() => navigation.goBack()} />
        </View>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Social</Text>
          <Text style={styles.title}>Following</Text>
          <Text style={styles.subtitle}>People you follow.</Text>
        </View>
        {error && <FollowingErrorBanner message={error} />}
        <FollowingSearchBar value={searchQuery} onChange={setSearchQuery} />
        {refreshing && !isPullRefreshing ? (
          <ActivityIndicator size="large" color="#E21E4D" style={styles.searchSpinner}  />
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
          // Inline header spinner already covers loading — only show text when truly done
          !loading && !refreshing ? (
            <Text style={styles.emptyText}>
              {searchQuery.trim() ? "No users found." : "Not following anyone yet."}
            </Text>
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
    </Pressable>
  );
}

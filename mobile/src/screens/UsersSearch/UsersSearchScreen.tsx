// src/screens/Users/UsersScreen.tsx
import React from "react";
import { View, Text, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { styles } from "./styles";
import type { UserRow } from "./types";
import { useUsersSearch } from "./hooks/useUsersSearch";
import { UsersSearchBar } from "./components/UsersSearchBar";
import { UserRowItem } from "./components/UserRowItem";

export default function UsersScreen() {
  const navigation = useNavigation<any>();

  const {
    q,
    loading,
    results,
    followingIds,
    togglingId,
    onChange,
    openProfile,
    toggleFollow,
  } = useUsersSearch({ navigation });

  const renderItem = ({ item }: { item: UserRow }) => {
    const isFollowing = followingIds.has(item.id);
    const isBusy = togglingId === item.id;

    return (
      <UserRowItem
        item={item}
        isFollowing={isFollowing}
        isBusy={isBusy}
        onPressRow={() => openProfile(item.id)}
        onPressFollow={() => toggleFollow(item.id)}
      />
    );
  };

  return (
    <View style={styles.container}>
      <UsersSearchBar value={q} onChangeText={onChange} loading={loading} />

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          q.trim().length >= 2 && !loading ? (
            <Text style={styles.emptyText}>No users found.</Text>
          ) : (
            <Text style={styles.emptyText}>Type at least 2 characters.</Text>
          )
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

// src/navigation/components/FeedHeader.tsx
import React, { useCallback, useState } from "react";
import { View, TouchableOpacity, Image, Text, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase/client";
import { navStyles } from "../styles";

export function FeedHeader({
  onOpenDrawer,
  onOpenFilters,
  hasActiveFilters,
  activeFilterCount,
  onProfile,
}: {
  onOpenDrawer: () => void;
  onOpenFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  onProfile: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const loadAvatar = useCallback(async () => {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      const url = data?.avatar_url ?? null;
      setAvatarUrl(url ? `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}` : null);
    } catch {
      setAvatarUrl(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAvatar();
    }, [loadAvatar])
  );

  return (
    <View style={[navStyles.headerWrapper, { paddingTop: insets.top }]}>
      <View style={navStyles.headerRow}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open navigation"
          style={navStyles.menuButton}
          onPress={onOpenDrawer}
        >
          <Text style={navStyles.menuIcon}>{"\u2630"}</Text>
        </TouchableOpacity>

        <View style={styles.rightRow}>
          {hasActiveFilters ? (
            <Text style={styles.activeFiltersLabel}>Filters: {activeFilterCount} active</Text>
          ) : null}

          <TouchableOpacity style={styles.filterBtn} onPress={onOpenFilters}>
            <MaterialIcons name="filter-list" size={18} color="#111" />
            {hasActiveFilters ? <View style={styles.activeDot} /> : null}
          </TouchableOpacity>

          <TouchableOpacity onPress={onProfile}>
            <Image
              source={
                avatarUrl
                  ? { uri: avatarUrl }
                  : require("../../../assets/default-avatar.png")
              }
              style={navStyles.avatar}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  activeFiltersLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1b5fc6",
    backgroundColor: "#eef4ff",
    borderWidth: 1,
    borderColor: "#d7e5ff",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  filterBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  activeDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#d32f2f",
  },
});

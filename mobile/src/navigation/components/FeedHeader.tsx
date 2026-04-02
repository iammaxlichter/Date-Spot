// src/navigation/components/FeedHeader.tsx
import React, { useCallback, useState } from "react";
import { View, TouchableOpacity, Image, Text, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase/client";

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
    <View style={[s.wrapper, { paddingTop: insets.top }]}>
      <View style={s.row}>
        {/* Hamburger */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open navigation"
          style={s.iconBtn}
          onPress={onOpenDrawer}
        >
          <MaterialIcons name="menu" size={22} color="#1D1D1D" />
        </TouchableOpacity>

        {/* Right actions */}
        <View style={s.right}>
          {/* Filter button */}
          <TouchableOpacity
            style={[s.filterBtn, hasActiveFilters && s.filterBtnActive]}
            onPress={onOpenFilters}
            accessibilityRole="button"
            accessibilityLabel="Open filters"
          >
            <MaterialIcons
              name="tune"
              size={18}
              color={hasActiveFilters ? "#E21E4D" : "#1D1D1D"}
            />
            {hasActiveFilters ? (
              <View style={s.badge}>
                <Text style={s.badgeText}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>

          {/* Avatar */}
          <TouchableOpacity onPress={onProfile} style={s.avatarWrap}>
            <Image
              source={
                avatarUrl
                  ? { uri: avatarUrl }
                  : require("../../../assets/default-avatar.png")
              }
              style={s.avatar}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  row: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Hamburger button
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
  },

  // Right side
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  // Filter button
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtnActive: {
    borderColor: "#FDD5DE",
    backgroundColor: "#FFF5F7",
  },
  badge: {
    position: "absolute",
    top: 5,
    right: 5,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#E21E4D",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 11,
  },

  // Avatar
  avatarWrap: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FDD5DE",
    padding: 1,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
});

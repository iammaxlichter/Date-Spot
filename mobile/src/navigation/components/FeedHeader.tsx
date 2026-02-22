// src/navigation/components/FeedHeader.tsx
import React, { useCallback, useState } from "react";
import { View, TouchableOpacity, Image, Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../services/supabase/client";
import { navStyles } from "../styles";

export function FeedHeader({
  onOpenDrawer,
  onProfile,
}: {
  onOpenDrawer: () => void;
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
  );
}

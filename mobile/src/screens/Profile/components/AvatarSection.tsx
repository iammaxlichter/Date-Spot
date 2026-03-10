import React from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { s } from "../styles";
import { UserAvatar } from "../../../components/UserAvatar";

export function AvatarSection(props: {
  uploading: boolean;
  avatarUrl: string | null;
  username: string | null;
  name: string | null;
  onPressAvatar: () => void;
  onPressName: () => void;
}) {
  const { uploading, avatarUrl, username, name, onPressAvatar, onPressName } = props;

  return (
    <>
      <Pressable onPress={onPressAvatar} disabled={uploading}>
        <UserAvatar uri={avatarUrl} size={120} style={s.avatar} />
        {uploading && (
          <View style={s.avatarOverlay}>
            <ActivityIndicator size="large"  color="#E21E4D" />
          </View>
        )}
      </Pressable>

      {username ? <Text style={s.username}>@{username}</Text> : null}

      <Pressable onPress={onPressName}>
        <Text style={s.name}>{name ?? "Your Name"}</Text>
      </Pressable>
    </>
  );
}

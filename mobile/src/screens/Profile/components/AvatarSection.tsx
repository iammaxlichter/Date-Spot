import React from "react";
import { View, Text, Image, Pressable, ActivityIndicator, ImageSourcePropType } from "react-native";
import { s } from "../styles";

export function AvatarSection(props: {
  uploading: boolean;
  avatarUrl: string | null;
  username: string | null;
  name: string | null;
  onPressAvatar: () => void;
  onPressName: () => void;
}) {
  const { uploading, avatarUrl, username, name, onPressAvatar, onPressName } = props;

  const avatarSource: ImageSourcePropType = avatarUrl
    ? { uri: avatarUrl }
    : require("../../../../assets/default-avatar.png");

  return (
    <>
      <Pressable onPress={onPressAvatar} disabled={uploading}>
        <Image source={avatarSource} style={s.avatar} />
        {uploading && (
          <View style={s.avatarOverlay}>
            <ActivityIndicator />
          </View>
        )}
      </Pressable>

      <Text style={s.hint}>Tap your picture to change it</Text>

      {username ? <Text style={s.username}>@{username}</Text> : null}

      <Pressable onPress={onPressName}>
        <Text style={s.name}>{name ?? "Your Name"}</Text>
      </Pressable>
    </>
  );
}

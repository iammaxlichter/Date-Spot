// src/screens/SpotDetails/components/SpotHeader.tsx
import React from "react";
import { View, Text, Pressable, Image, ImageSourcePropType } from "react-native";
import { s } from "../styles";

export function SpotHeader(props: {
  avatarSource: ImageSourcePropType;
  username: string;
  timeAgoText: string;
  onProfilePress: () => void;
}) {
  const { avatarSource, username, timeAgoText, onProfilePress } = props;

  return (
    <View style={s.headerRow}>
      <Pressable onPress={onProfilePress} hitSlop={6}>
        <Image source={avatarSource} style={s.avatar} />
      </Pressable>

      <View>
        <Pressable onPress={onProfilePress} hitSlop={6}>
          <Text style={s.username}>{username}</Text>
        </Pressable>

        <Text style={s.time}>{timeAgoText}</Text>
      </View>
    </View>
  );
}

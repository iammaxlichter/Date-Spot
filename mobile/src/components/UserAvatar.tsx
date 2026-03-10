import React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";

const DEFAULT_AVATAR = require("../../assets/default-avatar.png");

export function UserAvatar({
  uri,
  size,
  style,
}: {
  uri?: string | null;
  size: number;
  style?: StyleProp<ImageStyle>;
}) {
  const [imageFailed, setImageFailed] = React.useState(false);

  React.useEffect(() => {
    setImageFailed(false);
  }, [uri]);

  const circleStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    overflow: "hidden" as const,
  };

  const source = uri && !imageFailed ? { uri } : DEFAULT_AVATAR;

  return (
    <Image
      source={source}
      style={[circleStyle, style]}
      resizeMode="cover"
      onError={() => setImageFailed(true)}
    />
  );
}

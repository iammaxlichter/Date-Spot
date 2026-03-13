import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

const HEAD_SIZE = 36;
const TAIL_W = 10;
const TAIL_H = 14;
const PIN_HEIGHT = HEAD_SIZE + TAIL_H;

export function CenterPin({ dragging }: { dragging: boolean }) {
  const lift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(lift, {
      toValue: dragging ? 1 : 0,
      useNativeDriver: true,
      tension: 280,
      friction: 14,
    }).start();
  }, [dragging, lift]);

  const translateY = lift.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const shadowScaleX = lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const shadowOpacity = lift.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0.1] });

  return (
    <View style={s.anchor} pointerEvents="none">
      {/* Pin lifts on drag */}
      <Animated.View style={[s.pinWrap, { transform: [{ translateY }] }]}>
        <View style={s.head}>
          <View style={s.innerDot} />
        </View>
        <View style={s.tail} />
      </Animated.View>

      {/* Ground shadow */}
      <Animated.View
        style={[
          s.shadow,
          { transform: [{ scaleX: shadowScaleX }], opacity: shadowOpacity },
        ]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  // Positioned so the pin tip sits at the map center
  anchor: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -(HEAD_SIZE / 2),
    marginTop: -PIN_HEIGHT,
    width: HEAD_SIZE,
    alignItems: "center",
  },
  pinWrap: {
    alignItems: "center",
  },
  head: {
    width: HEAD_SIZE,
    height: HEAD_SIZE,
    borderRadius: HEAD_SIZE / 2,
    backgroundColor: "#E21E4D",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E21E4D",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  innerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: TAIL_W / 2,
    borderRightWidth: TAIL_W / 2,
    borderTopWidth: TAIL_H,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#E21E4D",
  },
  shadow: {
    marginTop: 2,
    width: 14,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#000",
  },
});

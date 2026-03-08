import React from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

const LOGO_SOURCE = require("../../../assets/icon.png");

export default function LaunchSplashScreen() {
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 500,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    const fadeIn = Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });

    pulse.start();
    fadeIn.start();

    return () => {
      pulse.stop();
      scaleAnim.stopAnimation();
      opacityAnim.stopAnimation();
    };
  }, [opacityAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={LOGO_SOURCE}
        resizeMode="contain"
        style={[
          styles.logo,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      />
      <Animated.Text style={[styles.title, { opacity: opacityAnim }]}>
        Date Spot
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  logo: {
    width: 130,
    height: 130,
  },
  title: {
    marginTop: 16,
    color: "#D91B46",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});

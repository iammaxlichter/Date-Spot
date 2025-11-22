import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";

export default function HomeScreen({ navigation }: any) {
  useEffect(() => {
    AsyncStorage.getItem("token").then(t =>
      console.log("TOKEN IN HOME:", t)
    );
  }, []);
  
  const onLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      navigation.replace("Login");
    } catch {
      Alert.alert("Error", "Failed to log out.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You’re in 🎉</Text>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 24 },
  logoutBtn: { backgroundColor: "#111", paddingVertical: 12, paddingHorizontal: 18, borderRadius: 8 },
  logoutText: { color: "white", fontWeight: "700" },
});

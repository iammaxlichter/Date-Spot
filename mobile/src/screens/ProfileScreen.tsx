import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

export default function ProfileScreen() {
  const user = {
    name: "Your Name",
    followers: 128,
    following: 94,
    avatarUrl: "https://i.pravatar.cc/300?img=12",
  };

  return (
    <View style={s.container}>
      <Image source={{ uri: user.avatarUrl }} style={s.avatar} />
      <Text style={s.name}>{user.name}</Text>

      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statNumber}>{user.followers}</Text>
          <Text style={s.statLabel}>Followers</Text>
        </View>

        <View style={s.statBox}>
          <Text style={s.statNumber}>{user.following}</Text>
          <Text style={s.statLabel}>Following</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingTop: 48 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 14 },
  name: { fontSize: 22, fontWeight: "700", marginBottom: 18 },
  statsRow: { flexDirection: "row", gap: 22 },
  statBox: {
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    minWidth: 120,
  },
  statNumber: { fontSize: 20, fontWeight: "700" },
  statLabel: { marginTop: 4, fontSize: 13, color: "#666" },
});

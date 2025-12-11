// src/lib/api/hooks.ts
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchUsers, getCurrentUser, type User } from "./users";

const TOKEN_KEY = "token";

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) throw new Error("Not authenticated");
      return fetchUsers(token);
    },
  });
}

export function useCurrentUser() {
  return useQuery<User>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) throw new Error("Not authenticated");
      return getCurrentUser(token);
    },
  });
}

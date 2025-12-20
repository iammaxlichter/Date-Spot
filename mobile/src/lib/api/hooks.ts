// src/lib/api/hooks.ts
import { useQuery } from "@tanstack/react-query";
import { fetchUsers, getCurrentUser, type User } from "./users";

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      return fetchUsers();
    },
  });
}

export function useCurrentUser() {
  return useQuery<User>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      return getCurrentUser();
    },
  });
}

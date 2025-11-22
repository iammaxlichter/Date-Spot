// src/lib/hooks.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchUsers, createUser, type User } from "../api";

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

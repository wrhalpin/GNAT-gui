import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";

export interface Me {
  user_id: string;
  username: string;
  role: string;
  permissions: string[];
}

export function useMe() {
  return useQuery<Me>({
    queryKey: ["me"],
    queryFn: () => api.get<Me>("/api/auth/me"),
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (creds: { username: string; password: string }) =>
      api.post("/api/auth/login", creds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/api/auth/logout"),
    onSuccess: () => {
      qc.clear();
      window.location.href = "/login";
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";

export interface Rule {
  id: string;
  name: string;
  engine: "hy" | "yaml" | "prolog";
  scope: "personal" | "team" | "shared";
  status: string;
  content: string;
  target_hypothesis?: string;
  owner_id: string;
  created_at: string;
}

const KEY = "rules";

export function useRules(engine?: string, scope?: string) {
  const params = new URLSearchParams();
  if (engine) params.set("engine", engine);
  if (scope) params.set("scope", scope);
  return useQuery<Rule[]>({
    queryKey: [KEY, { engine, scope }],
    queryFn: () => api.get(`/api/rules${params.toString() ? `?${params}` : ""}`),
  });
}

export function useRule(id: string) {
  return useQuery<Rule>({
    queryKey: [KEY, id],
    queryFn: () => api.get(`/api/rules/${id}`),
    enabled: !!id,
  });
}

export function useCreateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Rule>) => api.post<Rule>("/api/rules", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateRule(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Rule>) => api.put<Rule>(`/api/rules/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useTestRule(id: string) {
  return useMutation({
    mutationFn: (fixture: unknown) =>
      api.post<{ job_id: string }>(`/api/rules/${id}/test`, { fixture }),
  });
}

export function useRuleAuditTrail(id: string) {
  return useQuery({
    queryKey: [KEY, id, "audit-trail"],
    queryFn: () => api.get(`/api/rules/${id}/audit-trail`),
    enabled: !!id,
  });
}

export function usePromoteRule(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/api/rules/${id}/promote`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

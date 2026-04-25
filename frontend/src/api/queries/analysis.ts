import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";

export interface Investigation {
  id: string;
  title: string;
  status: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Hypothesis {
  id: string;
  statement: string;
  confidence: number;
  admiralty_source: string;
  admiralty_information: string;
  supporting_evidence: string[];
  refuting_evidence: string[];
}

export interface Note {
  id: string;
  content: string;
  tlp: string;
  author_id: string;
  created_at: string;
}

const KEY = "investigations";

export function useInvestigations(status?: string) {
  return useQuery<Investigation[]>({
    queryKey: [KEY, { status }],
    queryFn: () => api.get(`/api/analysis/investigations${status ? `?status=${status}` : ""}`),
  });
}

export function useInvestigation(id: string) {
  return useQuery<Investigation>({
    queryKey: [KEY, id],
    queryFn: () => api.get(`/api/analysis/investigations/${id}`),
    enabled: !!id,
  });
}

export function useCreateInvestigation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Investigation>) =>
      api.post<Investigation>("/api/analysis/investigations", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateInvestigation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Investigation>) =>
      api.patch<Investigation>(`/api/analysis/investigations/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useCreateHypothesis(investigationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Hypothesis>) =>
      api.post<Hypothesis>(`/api/analysis/investigations/${investigationId}/hypotheses`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, investigationId] }),
  });
}

export function useCreateNote(investigationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { content: string; tlp: string }) =>
      api.post<Note>(`/api/analysis/investigations/${investigationId}/notes`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, investigationId] }),
  });
}

export function useTimeline(investigationId: string) {
  return useQuery({
    queryKey: [KEY, investigationId, "timeline"],
    queryFn: () => api.get(`/api/analysis/investigations/${investigationId}/timeline`),
    enabled: !!investigationId,
  });
}

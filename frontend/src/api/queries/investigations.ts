import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";

export interface Seed {
  type: "indicator" | "threat_actor" | "campaign" | "custom";
  value: string;
  platform?: string;
}

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  data: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  confidence: number;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const KEY = "graph-investigations";

export function useSubmitBuild() {
  return useMutation({
    mutationFn: (seeds: Seed[]) =>
      api.post<{ job_id: string }>("/api/investigations", { seeds }),
  });
}

export function useGraph(investigationId: string) {
  return useQuery<Graph>({
    queryKey: [KEY, investigationId, "graph"],
    queryFn: () => api.get(`/api/investigations/${investigationId}/graph`),
    enabled: !!investigationId,
  });
}

export function useExpandNode(investigationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nodeId: string) =>
      api.post<{ job_id: string }>(`/api/investigations/${investigationId}/expand`, {
        node_id: nodeId,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, investigationId] }),
  });
}

export function useMaterialize(investigationId: string) {
  return useMutation({
    mutationFn: () => api.post(`/api/investigations/${investigationId}/materialize`),
  });
}

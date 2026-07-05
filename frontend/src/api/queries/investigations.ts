import { useQuery, useMutation } from "@tanstack/react-query";
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

export const GRAPH_KEY = "graph-investigations";
const KEY = GRAPH_KEY;

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
  // NOTE: no onSuccess invalidation here — the POST only returns a job_id; the new
  // nodes don't exist until the async job finishes. The graph is refetched when the
  // SSE `done` event arrives (see NodeDetailDrawer).
  return useMutation({
    mutationFn: (nodeId: string) =>
      api.post<{ job_id: string }>(`/api/investigations/${investigationId}/expand`, {
        node_id: nodeId,
      }),
  });
}

export function useMaterialize(investigationId: string) {
  return useMutation({
    mutationFn: () => api.post(`/api/investigations/${investigationId}/materialize`),
  });
}

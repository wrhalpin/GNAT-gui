import { useQueryClient } from "@tanstack/react-query";
import { useExpandNode, GRAPH_KEY } from "@/api/queries/investigations";
import type { GraphNode } from "@/api/queries/investigations";
import { openJobStream } from "@/lib/sse";
import { useState } from "react";

interface Props {
  node: GraphNode | null;
  investigationId: string;
  onClose: () => void;
}

export function NodeDetailDrawer({ node, investigationId, onClose }: Props) {
  const expand = useExpandNode(investigationId);
  const qc = useQueryClient();
  const [expanding, setExpanding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!node) return null;

  async function handleExpand() {
    if (!node) return;
    setError(null);
    setExpanding(true);
    try {
      const { job_id } = await expand.mutateAsync(node.id);
      openJobStream(
        job_id,
        () => {},
        () => {
          // Refetch the graph only once the expand job has actually finished, so
          // the newly discovered nodes/edges appear.
          qc.invalidateQueries({ queryKey: [GRAPH_KEY, investigationId] });
          setExpanding(false);
        },
        (msg) => {
          setError(msg);
          setExpanding(false);
        }
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Expand failed");
      setExpanding(false);
    }
  }

  return (
    <div className="absolute right-0 top-0 h-full w-80 border-l bg-background shadow-lg overflow-y-auto">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-medium">{node.label}</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Type</p>
          <p className="text-sm">{node.type}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Data</p>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-48">
            {JSON.stringify(node.data, null, 2)}
          </pre>
        </div>
        <button
          onClick={handleExpand}
          disabled={expanding}
          className="w-full rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
        >
          {expanding ? "Expanding..." : "Expand Node"}
        </button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}

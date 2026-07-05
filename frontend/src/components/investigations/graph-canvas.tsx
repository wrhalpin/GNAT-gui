import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useGraph, type GraphNode, type GraphEdge } from "@/api/queries/investigations";
import { NodeDetailDrawer } from "./node-detail-drawer";
import { EdgeFilter, type EdgeFilterState } from "./edge-filter";
import { CorrelationLegend } from "./correlation-legend";
import { MaterializeAction } from "./materialize-action";

function toFlowNode(n: GraphNode): Node {
  // The STIX type is kept in `data` for the detail drawer and styling; it is NOT
  // set as the React Flow node `type`, since we register no custom nodeTypes and
  // doing so would make React Flow warn and fall back to an error node.
  return {
    id: n.id,
    position: n.position,
    data: { label: n.label, stixType: n.type, ...n.data },
  };
}

function toFlowEdge(e: GraphEdge): Edge {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.type,
    style: { strokeWidth: 1 + e.confidence * 2 },
    data: { confidence: e.confidence, type: e.type },
  };
}

export function GraphCanvas({ investigationId }: { investigationId: string }) {
  const { data: graph } = useGraph(investigationId);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filter, setFilter] = useState<EdgeFilterState>({
    types: new Set(["uses", "indicates", "attributed-to", "targets", "related-to", "mitigates"]),
    minConfidence: 0,
  });

  const rawNodes = useMemo(() => graph?.nodes ?? [], [graph]);
  const rawEdges = useMemo(() => graph?.edges ?? [], [graph]);

  const filteredEdges = useMemo(
    () =>
      rawEdges.filter(
        (e) => filter.types.has(e.type) && e.confidence >= filter.minConfidence
      ),
    [rawEdges, filter]
  );

  const [showLegend, setShowLegend] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // useNodesState/useEdgesState only seed from their initial argument; the query
  // resolves after mount, so the data must be pushed into React Flow state here —
  // otherwise the canvas stays permanently empty and the edge filter is inert.
  useEffect(() => {
    setNodes(rawNodes.map(toFlowNode));
  }, [rawNodes, setNodes]);

  useEffect(() => {
    setEdges(filteredEdges.map(toFlowEdge));
  }, [filteredEdges, setEdges]);

  const allEdgeTypes = useMemo(
    () => [...new Set(rawEdges.map((e) => e.type))],
    [rawEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const original = rawNodes.find((n) => n.id === node.id) ?? null;
      setSelectedNode(original);
    },
    [rawNodes]
  );

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      <div className="absolute left-3 top-3 w-56">
        <EdgeFilter allTypes={allEdgeTypes} value={filter} onChange={setFilter} />
      </div>

      <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
        <button
          onClick={() => setShowLegend((v) => !v)}
          className="rounded border bg-background px-3 py-1.5 text-sm shadow-sm hover:bg-accent"
        >
          {showLegend ? "Hide legend" : "Legend"}
        </button>
        {showLegend && <CorrelationLegend />}
      </div>

      <div className="absolute bottom-3 left-3">
        <MaterializeAction investigationId={investigationId} />
      </div>

      <NodeDetailDrawer
        node={selectedNode}
        investigationId={investigationId}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
}

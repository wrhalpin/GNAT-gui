import { useCallback, useState } from "react";
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
import { MaterializeAction } from "./materialize-action";

function toFlowNode(n: GraphNode): Node {
  return { id: n.id, position: n.position, data: { label: n.label, ...n.data }, type: n.type };
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

  const rawNodes = graph?.nodes ?? [];
  const rawEdges = graph?.edges ?? [];

  const filteredEdges = rawEdges.filter(
    (e) => filter.types.has(e.type) && e.confidence >= filter.minConfidence
  );

  const [nodes, , onNodesChange] = useNodesState(rawNodes.map(toFlowNode));
  const [edges, , onEdgesChange] = useEdgesState(filteredEdges.map(toFlowEdge));

  const allEdgeTypes = [...new Set(rawEdges.map((e) => e.type))];

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

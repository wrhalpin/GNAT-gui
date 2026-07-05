import { useParams } from "@tanstack/react-router";
import { GraphCanvas } from "@/components/investigations/graph-canvas";

export function InvestigationGraphPage() {
  const { id = "" } = useParams({ strict: false });
  return (
    <div className="h-[calc(100vh-6rem)]">
      <GraphCanvas investigationId={id} />
    </div>
  );
}

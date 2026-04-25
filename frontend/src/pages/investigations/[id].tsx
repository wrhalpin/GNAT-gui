import { createFileRoute } from "@tanstack/react-router";
import { GraphCanvas } from "@/components/investigations/graph-canvas";

export const Route = createFileRoute("/investigations/$id")({
  component: InvestigationGraphPage,
});

function InvestigationGraphPage() {
  const { id } = Route.useParams();
  return (
    <div className="h-[calc(100vh-6rem)]">
      <GraphCanvas investigationId={id} />
    </div>
  );
}

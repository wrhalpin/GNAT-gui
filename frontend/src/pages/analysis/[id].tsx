import { createFileRoute } from "@tanstack/react-router";
import { InvestigationDetail } from "@/components/analysis/investigation-detail";

export const Route = createFileRoute("/analysis/$id")({
  component: InvestigationDetailPage,
});

function InvestigationDetailPage() {
  const { id } = Route.useParams();
  return <InvestigationDetail id={id} />;
}

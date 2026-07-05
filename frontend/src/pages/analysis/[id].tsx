import { useParams } from "@tanstack/react-router";
import { InvestigationDetail } from "@/components/analysis/investigation-detail";

export function InvestigationDetailPage() {
  const { id } = useParams({ strict: false });
  return <InvestigationDetail id={id!} />;
}

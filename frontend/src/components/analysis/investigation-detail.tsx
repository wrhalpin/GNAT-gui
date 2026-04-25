import { useInvestigation } from "@/api/queries/analysis";
import { HypothesisCard } from "./hypothesis-card";
import { TimelineView } from "./timeline-view";
import type { Hypothesis } from "@/api/queries/analysis";

export function InvestigationDetail({ id }: { id: string }) {
  const { data: inv, isLoading } = useInvestigation(id);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (!inv) return <p className="text-sm text-destructive">Investigation not found</p>;

  const hypotheses: Hypothesis[] = (inv as any).hypotheses ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{(inv as any).title}</h2>
        <span className="rounded border px-2 py-0.5 text-sm">{inv.status}</span>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Hypotheses</h3>
        <div className="space-y-2">
          {hypotheses.map((h) => (
            <HypothesisCard key={h.id} hypothesis={h} />
          ))}
          {hypotheses.length === 0 && (
            <p className="text-sm text-muted-foreground">No hypotheses yet.</p>
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Timeline</h3>
        <TimelineView investigationId={id} />
      </section>
    </div>
  );
}

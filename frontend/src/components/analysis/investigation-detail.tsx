import { useInvestigation } from "@/api/queries/analysis";
import type { Hypothesis, Note } from "@/api/queries/analysis";
import { HypothesisCard } from "./hypothesis-card";
import { HypothesisForm } from "./hypothesis-form";
import { NotesPanel } from "./notes-panel";
import { TimelineView } from "./timeline-view";
import { GapDetectionPanel } from "./gap-detection-panel";
import { ReportDraftingPanel } from "./report-drafting-panel";

export function InvestigationDetail({ id }: { id: string }) {
  const { data: inv, isLoading } = useInvestigation(id);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (!inv) return <p className="text-sm text-destructive">Investigation not found</p>;

  const hypotheses: Hypothesis[] = (inv as unknown as { hypotheses?: Hypothesis[] }).hypotheses ?? [];
  const notes: Note[] = (inv as unknown as { notes?: Note[] }).notes ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {(inv as unknown as { title?: string }).title}
          </h2>
          <span className="rounded border px-2 py-0.5 text-sm">{inv.status}</span>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Hypotheses</h3>
            <HypothesisForm investigationId={id} />
          </div>
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
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Notes</h3>
          <NotesPanel investigationId={id} notes={notes} />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Timeline</h3>
          <TimelineView investigationId={id} />
        </section>
      </div>

      <div className="space-y-4">
        <GapDetectionPanel investigationId={id} />
        <ReportDraftingPanel investigationId={id} />
      </div>
    </div>
  );
}

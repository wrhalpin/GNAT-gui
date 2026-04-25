import { ConfidenceBadge } from "./confidence-badge";
import type { Hypothesis } from "@/api/queries/analysis";

interface Props {
  hypothesis: Hypothesis;
  onEdit?: (h: Hypothesis) => void;
}

export function HypothesisCard({ hypothesis, onEdit }: Props) {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{hypothesis.statement}</p>
        {onEdit && (
          <button
            onClick={() => onEdit(hypothesis)}
            className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
          >
            Edit
          </button>
        )}
      </div>
      <ConfidenceBadge
        source={hypothesis.admiralty_source}
        information={hypothesis.admiralty_information}
        confidence={hypothesis.confidence}
      />
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>Supporting: {hypothesis.supporting_evidence.length}</span>
        <span>Refuting: {hypothesis.refuting_evidence.length}</span>
      </div>
    </div>
  );
}

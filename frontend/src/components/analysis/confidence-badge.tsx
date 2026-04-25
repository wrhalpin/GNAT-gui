import { cn } from "@/lib/utils";

const ADMIRALTY_SOURCE: Record<string, { label: string; color: string }> = {
  A: { label: "Completely reliable", color: "bg-green-100 text-green-800" },
  B: { label: "Usually reliable", color: "bg-blue-100 text-blue-800" },
  C: { label: "Fairly reliable", color: "bg-yellow-100 text-yellow-800" },
  D: { label: "Not usually reliable", color: "bg-orange-100 text-orange-800" },
  E: { label: "Unreliable", color: "bg-red-100 text-red-800" },
  F: { label: "Cannot be judged", color: "bg-gray-100 text-gray-800" },
};

const ADMIRALTY_INFO: Record<string, { label: string; color: string }> = {
  "1": { label: "Confirmed", color: "bg-green-100 text-green-800" },
  "2": { label: "Probably true", color: "bg-blue-100 text-blue-800" },
  "3": { label: "Possibly true", color: "bg-yellow-100 text-yellow-800" },
  "4": { label: "Doubtful", color: "bg-orange-100 text-orange-800" },
  "5": { label: "Improbable", color: "bg-red-100 text-red-800" },
  "6": { label: "Cannot be judged", color: "bg-gray-100 text-gray-800" },
};

interface Props {
  source: string;
  information: string;
  confidence?: number;
}

export function ConfidenceBadge({ source, information, confidence }: Props) {
  const s = ADMIRALTY_SOURCE[source];
  const i = ADMIRALTY_INFO[information];

  return (
    <div className="flex items-center gap-1.5">
      {s && (
        <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", s.color)}>
          {source}: {s.label}
        </span>
      )}
      {i && (
        <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", i.color)}>
          {information}: {i.label}
        </span>
      )}
      {confidence !== undefined && (
        <span className="text-xs text-muted-foreground">{Math.round(confidence * 100)}%</span>
      )}
    </div>
  );
}

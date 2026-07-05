import { useState } from "react";
import { useSubmitGapDetection } from "@/api/queries/analysis";
import { openJobStream, type StreamEvent } from "@/lib/sse";

interface Gap {
  gap_type?: string;
  description?: string;
  severity?: string;
  affected_nodes?: string[];
  suggested_action?: string;
}

const SEVERITY_STYLES: Record<string, string> = {
  high: "border-l-red-500 bg-red-50",
  medium: "border-l-amber-500 bg-amber-50",
  low: "border-l-slate-400 bg-slate-50",
};

export function GapDetectionPanel({ investigationId }: { investigationId: string }) {
  const submit = useSubmitGapDetection(investigationId);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [gaps, setGaps] = useState<Gap[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    setGaps(null);
    setProgress(0);
    setRunning(true);
    try {
      const { job_id } = await submit.mutateAsync(undefined);
      openJobStream(
        job_id,
        (evt: StreamEvent) => {
          if (evt.type === "progress") {
            setProgress(evt.progress ?? 0);
            setMessage(evt.message ?? "");
          }
        },
        (done) => {
          const result = (done.result ?? {}) as { gaps?: Gap[] };
          setGaps(result.gaps ?? []);
          setRunning(false);
        },
        (msg) => {
          setError(msg || "Gap detection failed");
          setRunning(false);
        }
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start");
      setRunning(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Gap Detection</h3>
        <button
          onClick={run}
          disabled={running}
          className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
        >
          {running ? "Analysing..." : "Run"}
        </button>
      </div>

      {running && (
        <div className="space-y-1">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {gaps && gaps.length === 0 && (
        <p className="text-sm text-muted-foreground">No gaps detected.</p>
      )}

      {gaps && gaps.length > 0 && (
        <ul className="space-y-2">
          {gaps.map((g, i) => (
            <li
              key={i}
              className={`rounded border-l-4 p-2 text-sm ${
                SEVERITY_STYLES[g.severity ?? "low"] ?? SEVERITY_STYLES.low
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{g.gap_type ?? "gap"}</span>
                {g.severity && (
                  <span className="text-xs uppercase text-muted-foreground">{g.severity}</span>
                )}
              </div>
              {g.description && <p className="text-xs text-slate-700">{g.description}</p>}
              {g.suggested_action && (
                <p className="mt-1 text-xs italic text-slate-600">→ {g.suggested_action}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

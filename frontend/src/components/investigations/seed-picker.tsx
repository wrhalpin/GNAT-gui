import { useState } from "react";
import { useSubmitBuild, type Seed } from "@/api/queries/investigations";
import { openJobStream, type StreamEvent } from "@/lib/sse";

interface Props {
  onComplete: (investigationId: string) => void;
}

const SEED_TYPES: Seed["type"][] = ["indicator", "threat_actor", "campaign", "custom"];

export function SeedPicker({ onComplete }: Props) {
  const [seeds, setSeeds] = useState<Seed[]>([{ type: "indicator", value: "" }]);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = useSubmitBuild();

  function updateSeed(i: number, patch: Partial<Seed>) {
    setSeeds((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  }

  async function handleBuild(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRunning(true);
    try {
      const { job_id } = await submit.mutateAsync(seeds.filter((s) => s.value));
      openJobStream(
        job_id,
        (evt: StreamEvent) => {
          if (evt.type === "progress") {
            setProgress(evt.progress ?? 0);
            setMessage(evt.message ?? "");
          }
          if (evt.type === "done" && evt.result?.investigation_id) {
            onComplete(evt.result.investigation_id as string);
          }
        },
        () => setRunning(false),
        (msg) => { setError(msg || "Build failed"); setRunning(false); }
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setRunning(false);
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-xl font-semibold">New Investigation</h2>
      <form onSubmit={handleBuild} className="space-y-3">
        {seeds.map((seed, i) => (
          <div key={i} className="flex gap-2">
            <select
              value={seed.type}
              onChange={(e) => updateSeed(i, { type: e.target.value as Seed["type"] })}
              className="rounded border px-2 py-1.5 text-sm"
            >
              {SEED_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input
              value={seed.value}
              onChange={(e) => updateSeed(i, { value: e.target.value })}
              placeholder="Value (e.g. 8.8.8.8, APT28)"
              className="flex-1 rounded border px-3 py-1.5 text-sm"
              required
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setSeeds((p) => [...p, { type: "indicator", value: "" }])}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          + Add seed
        </button>
        <button
          type="submit"
          disabled={running}
          className="w-full rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
        >
          {running ? "Building..." : "Build Investigation"}
        </button>
      </form>

      {running && (
        <div className="space-y-1">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

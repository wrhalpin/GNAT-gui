import { useState } from "react";
import { useTestRule } from "@/api/queries/rules";
import { openJobStream, type StreamEvent } from "@/lib/sse";

interface Props {
  ruleId: string;
}

export function TestRunnerPanel({ ruleId }: Props) {
  const [fixture, setFixture] = useState("{}");
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const testRule = useTestRule(ruleId);

  async function runTest() {
    setEvents([]);
    setError(null);
    setRunning(true);
    try {
      const parsed = JSON.parse(fixture);
      const { job_id } = await testRule.mutateAsync(parsed);
      openJobStream(
        job_id,
        (evt) => setEvents((prev) => [...prev, evt]),
        () => setRunning(false),
        (msg) => { setError(msg || "Stream error"); setRunning(false); }
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setRunning(false);
    }
  }

  const result = events.find((e) => e.type === "done")?.result;
  const progress = events.filter((e) => e.type === "progress").at(-1);

  return (
    <div className="space-y-3 p-3 border rounded-lg">
      <h3 className="text-sm font-medium">Test Runner</h3>
      <textarea
        value={fixture}
        onChange={(e) => setFixture(e.target.value)}
        className="w-full rounded border p-2 font-mono text-xs h-32"
        placeholder="Paste evidence JSON fixture..."
      />
      <button
        onClick={runTest}
        disabled={running}
        className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
      >
        {running ? "Running..." : "Run Test"}
      </button>
      {progress && (
        <div className="space-y-1">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(progress.progress ?? 0) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{progress.message}</p>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {result && (
        <pre className="rounded bg-muted p-2 text-xs overflow-auto max-h-48">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

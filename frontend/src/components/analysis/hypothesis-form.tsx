import { useState } from "react";
import { useCreateHypothesis } from "@/api/queries/analysis";

const SOURCE_RELIABILITY = ["A", "B", "C", "D", "E", "F"];
const INFO_CREDIBILITY = ["1", "2", "3", "4", "5", "6"];

export function HypothesisForm({ investigationId }: { investigationId: string }) {
  const create = useCreateHypothesis(investigationId);
  const [open, setOpen] = useState(false);
  const [statement, setStatement] = useState("");
  const [source, setSource] = useState("B");
  const [info, setInfo] = useState("2");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await create.mutateAsync({
        statement,
        admiralty_source: source,
        admiralty_information: info,
      });
      setStatement("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add hypothesis");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded border px-3 py-1.5 text-sm hover:bg-accent"
      >
        + New Hypothesis
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-lg border p-3">
      <textarea
        value={statement}
        onChange={(e) => setStatement(e.target.value)}
        placeholder="Hypothesis statement..."
        required
        className="w-full rounded border p-2 text-sm"
        rows={2}
      />
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs">
          <span className="mb-1 block text-muted-foreground">Source reliability</span>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="rounded border px-2 py-1.5 text-sm"
          >
            {SOURCE_RELIABILITY.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="mb-1 block text-muted-foreground">Info credibility</span>
          <select
            value={info}
            onChange={(e) => setInfo(e.target.value)}
            className="rounded border px-2 py-1.5 text-sm"
          >
            {INFO_CREDIBILITY.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <span className="rounded bg-muted px-2 py-1 font-mono text-sm">
          {source}
          {info}
        </span>
        <button
          type="submit"
          disabled={create.isPending}
          className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
        >
          {create.isPending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}

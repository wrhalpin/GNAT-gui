import { useState } from "react";
import { InvestigationList } from "@/components/analysis/investigation-list";
import { useCreateInvestigation } from "@/api/queries/analysis";

const STATUSES = ["", "OPEN", "IN_PROGRESS", "REVIEW", "CLOSED"];

export function AnalysisIndex() {
  const [status, setStatus] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const create = useCreateInvestigation();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await create.mutateAsync({ title } as any);
    setTitle("");
    setShowNew(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Investigations</h1>
        <button
          onClick={() => setShowNew(true)}
          className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90"
        >
          New
        </button>
      </div>

      {showNew && (
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Investigation title"
            className="flex-1 rounded-md border px-3 py-1.5 text-sm"
            required
          />
          <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
            Create
          </button>
          <button type="button" onClick={() => setShowNew(false)} className="text-sm text-muted-foreground">
            Cancel
          </button>
        </form>
      )}

      <div className="flex gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded px-2 py-1 text-xs ${status === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      <InvestigationList statusFilter={status || undefined} />
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { RuleList } from "@/components/rules/rule-list";
import { useCreateRule } from "@/api/queries/rules";

export const Route = createFileRoute("/rules/")({
  component: RulesIndex,
});

const ENGINES = ["", "hy", "yaml", "prolog"];
const SCOPES = ["", "personal", "team", "shared"];

function RulesIndex() {
  const [engine, setEngine] = useState("");
  const [scope, setScope] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [newEngine, setNewEngine] = useState<"hy" | "yaml" | "prolog">("yaml");
  const create = useCreateRule();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await create.mutateAsync({ name, engine: newEngine, scope: "personal", content: "" } as any);
    setName("");
    setShowNew(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rules</h1>
        <button
          onClick={() => setShowNew(true)}
          className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90"
        >
          New Rule
        </button>
      </div>

      {showNew && (
        <form onSubmit={handleCreate} className="flex gap-2 items-center">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Rule name"
            className="flex-1 rounded-md border px-3 py-1.5 text-sm"
            required
          />
          <select
            value={newEngine}
            onChange={(e) => setNewEngine(e.target.value as any)}
            className="rounded-md border px-2 py-1.5 text-sm"
          >
            <option value="yaml">YAML</option>
            <option value="hy">Hy</option>
            <option value="prolog">Prolog</option>
          </select>
          <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
            Create
          </button>
          <button type="button" onClick={() => setShowNew(false)} className="text-sm text-muted-foreground">
            Cancel
          </button>
        </form>
      )}

      <div className="flex gap-4">
        <div className="flex gap-1">
          {ENGINES.map((e) => (
            <button key={e} onClick={() => setEngine(e)}
              className={`rounded px-2 py-0.5 text-xs ${engine === e ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {e || "All engines"}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {SCOPES.map((s) => (
            <button key={s} onClick={() => setScope(s)}
              className={`rounded px-2 py-0.5 text-xs ${scope === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {s || "All scopes"}
            </button>
          ))}
        </div>
      </div>

      <RuleList engine={engine || undefined} scope={scope || undefined} />
    </div>
  );
}

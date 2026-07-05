import { useState } from "react";
import { useCreateNote, type Note } from "@/api/queries/analysis";
import { TLPMarking } from "./tlp-marking";

const TLP_LEVELS = ["white", "green", "amber", "amber+strict", "red"];

export function NotesPanel({
  investigationId,
  notes,
}: {
  investigationId: string;
  notes: Note[];
}) {
  const create = useCreateNote(investigationId);
  const [content, setContent] = useState("");
  const [tlp, setTlp] = useState("amber");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await create.mutateAsync({ content, tlp });
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add note");
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {notes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
        {notes.map((n) => (
          <div key={n.id} className="rounded border p-2">
            <div className="mb-1 flex items-center gap-2">
              <TLPMarking tlp={n.tlp} />
              <span className="text-xs text-muted-foreground">
                {new Date(n.created_at).toLocaleString()}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm">{n.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-2 rounded-lg border p-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a note..."
          required
          rows={2}
          className="w-full rounded border p-2 text-sm"
        />
        <div className="flex items-center gap-2">
          <select
            value={tlp}
            onChange={(e) => setTlp(e.target.value)}
            className="rounded border px-2 py-1.5 text-sm"
          >
            {TLP_LEVELS.map((t) => (
              <option key={t} value={t}>
                TLP:{t}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={create.isPending}
            className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
          >
            {create.isPending ? "Adding..." : "Add note"}
          </button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
    </div>
  );
}

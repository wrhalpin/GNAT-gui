import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/api/client";

interface AuditRow {
  id: string;
  username: string | null;
  action: string;
  target_id: string | null;
  source_ip: string | null;
  timestamp: string;
}

const ACTIONS = [
  "",
  "auth.login",
  "auth.logout",
  "auth.login_failed",
  "auth.permission_denied",
  "investigation.created",
  "investigation.updated",
  "investigation.deleted",
  "investigation.materialized",
  "rule.created",
  "rule.updated",
  "rule.promoted",
  "report.created",
  "report.published",
  "admin.user_created",
  "admin.user_updated",
  "admin.user_deactivated",
];

const PAGE_SIZE = 50;

export function AuditPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [after, setAfter] = useState("");
  const [before, setBefore] = useState("");

  const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
  if (action) params.set("action", action);
  if (after) params.set("after", new Date(after).toISOString());
  if (before) params.set("before", new Date(before).toISOString());

  const { data, isLoading } = useQuery<{ items: AuditRow[]; total: number; page: number }>({
    queryKey: ["admin", "audit", page, action, after, before],
    queryFn: () => api.get(`/api/admin/audit?${params.toString()}`),
  });

  const total = data?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function resetPageAnd(fn: () => void) {
    setPage(1);
    fn();
  }

  if (isLoading && !data) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Audit Log</h1>

      <div className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
        <label className="text-xs">
          <span className="mb-1 block text-muted-foreground">Action</span>
          <select
            value={action}
            onChange={(e) => resetPageAnd(() => setAction(e.target.value))}
            className="rounded border px-2 py-1.5 text-sm"
          >
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a || "All"}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="mb-1 block text-muted-foreground">After</span>
          <input
            type="datetime-local"
            value={after}
            onChange={(e) => resetPageAnd(() => setAfter(e.target.value))}
            className="rounded border px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="mb-1 block text-muted-foreground">Before</span>
          <input
            type="datetime-local"
            value={before}
            onChange={(e) => resetPageAnd(() => setBefore(e.target.value))}
            className="rounded border px-2 py-1.5 text-sm"
          />
        </label>
        {(action || after || before) && (
          <button
            onClick={() =>
              resetPageAnd(() => {
                setAction("");
                setAfter("");
                setBefore("");
              })
            }
            className="rounded px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 font-medium">Time</th>
            <th className="pb-2 font-medium">User</th>
            <th className="pb-2 font-medium">Action</th>
            <th className="pb-2 font-medium">Target</th>
            <th className="pb-2 font-medium">IP</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {(data?.items ?? []).map((e) => (
            <tr key={e.id}>
              <td className="py-1.5 text-xs">{new Date(e.timestamp).toLocaleString()}</td>
              <td className="py-1.5">{e.username ?? "—"}</td>
              <td className="py-1.5 font-mono text-xs">{e.action}</td>
              <td className="py-1.5 text-xs text-muted-foreground">{e.target_id ?? "—"}</td>
              <td className="py-1.5 text-xs text-muted-foreground">{e.source_ip ?? "—"}</td>
            </tr>
          ))}
          {(data?.items ?? []).length === 0 && (
            <tr>
              <td colSpan={5} className="py-3 text-sm text-muted-foreground">
                No matching events.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="disabled:opacity-50"
        >
          ← Prev
        </button>
        <span className="text-muted-foreground">
          Page {page} of {maxPage} ({total} events)
        </span>
        <button
          onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
          disabled={page >= maxPage}
          className="hover:text-foreground disabled:opacity-50"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

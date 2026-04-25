import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/api/client";

export const Route = createFileRoute("/admin/audit")({
  component: AuditPage,
});

interface AuditRow {
  id: string;
  username: string | null;
  action: string;
  target_id: string | null;
  source_ip: string | null;
  timestamp: string;
}

function AuditPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery<{ items: AuditRow[]; total: number; page: number }>({
    queryKey: ["admin", "audit", page],
    queryFn: () => api.get(`/api/admin/audit?page=${page}&page_size=50`),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Audit Log</h1>
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
        </tbody>
      </table>
      <div className="flex gap-2 text-sm">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="disabled:opacity-50">
          ← Prev
        </button>
        <span className="text-muted-foreground">Page {page}</span>
        <button onClick={() => setPage((p) => p + 1)} className="hover:text-foreground">
          Next →
        </button>
      </div>
    </div>
  );
}

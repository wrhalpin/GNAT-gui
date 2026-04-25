import { Link } from "@tanstack/react-router";
import { useInvestigations, type Investigation } from "@/api/queries/analysis";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  REVIEW: "bg-purple-100 text-purple-800",
  CLOSED: "bg-gray-100 text-gray-800",
};

export function InvestigationList({ statusFilter }: { statusFilter?: string }) {
  const { data, isLoading, error } = useInvestigations(statusFilter);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (error) return <p className="text-sm text-destructive">Failed to load investigations</p>;

  return (
    <div className="space-y-2">
      {(data ?? []).map((inv: Investigation) => (
        <Link
          key={inv.id}
          to="/analysis/$id"
          params={{ id: inv.id }}
          className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent"
        >
          <div>
            <p className="text-sm font-medium">{inv.title}</p>
            <p className="text-xs text-muted-foreground">
              Updated {new Date(inv.updated_at).toLocaleDateString()}
            </p>
          </div>
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[inv.status] ?? "bg-gray-100 text-gray-800"}`}
          >
            {inv.status}
          </span>
        </Link>
      ))}
      {data?.length === 0 && (
        <p className="text-sm text-muted-foreground">No investigations yet.</p>
      )}
    </div>
  );
}

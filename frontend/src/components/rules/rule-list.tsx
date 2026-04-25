import { Link } from "@tanstack/react-router";
import { useRules, type Rule } from "@/api/queries/rules";

const ENGINE_COLORS: Record<string, string> = {
  hy: "bg-purple-100 text-purple-800",
  yaml: "bg-blue-100 text-blue-800",
  prolog: "bg-green-100 text-green-800",
};

export function RuleList({ engine, scope }: { engine?: string; scope?: string }) {
  const { data, isLoading } = useRules(engine, scope);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-2">
      {(data ?? []).map((rule: Rule) => (
        <Link
          key={rule.id}
          to="/rules/$id"
          params={{ id: rule.id }}
          className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent"
        >
          <div>
            <p className="text-sm font-medium">{rule.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{rule.scope}</p>
          </div>
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${ENGINE_COLORS[rule.engine] ?? ""}`}>
            {rule.engine}
          </span>
        </Link>
      ))}
      {data?.length === 0 && <p className="text-sm text-muted-foreground">No rules yet.</p>}
    </div>
  );
}

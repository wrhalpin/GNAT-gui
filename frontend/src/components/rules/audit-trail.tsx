import { useRuleAuditTrail } from "@/api/queries/rules";

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  detail?: string;
}

export function AuditTrail({ ruleId }: { ruleId: string }) {
  const { data, isLoading } = useRuleAuditTrail(ruleId);
  const entries: AuditEntry[] = (data as AuditEntry[]) ?? [];

  if (isLoading) return <p className="text-xs text-muted-foreground">Loading audit trail...</p>;

  return (
    <div className="space-y-1">
      {entries.map((e) => (
        <div key={e.id} className="flex gap-3 text-xs border-l-2 border-muted pl-2">
          <span className="text-muted-foreground min-w-[140px]">
            {new Date(e.timestamp).toLocaleString()}
          </span>
          <span className="font-medium">{e.action}</span>
          <span className="text-muted-foreground">{e.user}</span>
          {e.detail && <span>{e.detail}</span>}
        </div>
      ))}
      {entries.length === 0 && <p className="text-xs text-muted-foreground">No audit entries.</p>}
    </div>
  );
}

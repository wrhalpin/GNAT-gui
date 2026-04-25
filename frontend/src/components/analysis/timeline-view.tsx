import { useTimeline } from "@/api/queries/analysis";

interface TimelineEvent {
  id: string;
  timestamp: string;
  description: string;
  source: string;
  tlp: string;
}

export function TimelineView({ investigationId }: { investigationId: string }) {
  const { data, isLoading } = useTimeline(investigationId);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading timeline...</p>;

  const events: TimelineEvent[] = (data as TimelineEvent[]) ?? [];

  return (
    <div className="space-y-2">
      {events.map((evt) => (
        <div key={evt.id} className="flex gap-3 border-l-2 border-border pl-3">
          <div className="min-w-[120px] text-xs text-muted-foreground">
            {new Date(evt.timestamp).toLocaleString()}
          </div>
          <div>
            <p className="text-sm">{evt.description}</p>
            <p className="text-xs text-muted-foreground">{evt.source}</p>
          </div>
        </div>
      ))}
      {events.length === 0 && (
        <p className="text-sm text-muted-foreground">No timeline events.</p>
      )}
    </div>
  );
}

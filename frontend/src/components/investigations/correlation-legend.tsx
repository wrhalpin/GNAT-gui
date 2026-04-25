const EDGE_STYLES: { type: string; color: string; desc: string }[] = [
  { type: "uses", color: "bg-blue-500", desc: "Threat actor uses malware/tool" },
  { type: "indicates", color: "bg-yellow-500", desc: "Indicator points to threat" },
  { type: "attributed-to", color: "bg-red-500", desc: "Campaign attributed to actor" },
  { type: "targets", color: "bg-orange-500", desc: "Actor targets sector/org" },
  { type: "related-to", color: "bg-gray-400", desc: "General relationship" },
  { type: "mitigates", color: "bg-green-500", desc: "Control mitigates technique" },
];

export function CorrelationLegend() {
  return (
    <div className="rounded border bg-background p-3 shadow-sm space-y-1.5">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Edge types
      </h4>
      {EDGE_STYLES.map((e) => (
        <div key={e.type} className="flex items-center gap-2">
          <span className={`h-2 w-6 rounded-full ${e.color}`} />
          <span className="text-xs font-medium">{e.type}</span>
          <span className="text-xs text-muted-foreground">{e.desc}</span>
        </div>
      ))}
      <div className="border-t pt-1.5 mt-1">
        <p className="text-xs text-muted-foreground">Edge thickness = correlation confidence</p>
      </div>
    </div>
  );
}

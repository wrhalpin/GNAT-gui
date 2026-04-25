import { useState } from "react";

export interface EdgeFilterState {
  types: Set<string>;
  minConfidence: number;
}

const EDGE_TYPES = ["uses", "indicates", "attributed-to", "targets", "related-to", "mitigates"];

interface Props {
  allTypes: string[];
  value: EdgeFilterState;
  onChange: (state: EdgeFilterState) => void;
}

export function EdgeFilter({ allTypes, value, onChange }: Props) {
  const types = allTypes.length > 0 ? allTypes : EDGE_TYPES;

  function toggleType(t: string) {
    const next = new Set(value.types);
    if (next.has(t)) next.delete(t); else next.add(t);
    onChange({ ...value, types: next });
  }

  return (
    <div className="space-y-2 rounded border p-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Edge Filters
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => toggleType(t)}
            className={`rounded px-2 py-0.5 text-xs ${value.types.has(t) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">Min confidence</label>
        <input
          type="range"
          min={0} max={1} step={0.05}
          value={value.minConfidence}
          onChange={(e) => onChange({ ...value, minConfidence: parseFloat(e.target.value) })}
          className="flex-1"
        />
        <span className="text-xs">{Math.round(value.minConfidence * 100)}%</span>
      </div>
    </div>
  );
}

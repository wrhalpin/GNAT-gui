import { useState } from "react";

interface Condition {
  predicate: string;
  args: string;
}

interface YAMLRule {
  name: string;
  engine: "yaml";
  conditions: Condition[];
  action: string;
  tlp_ceiling: string;
  confidence_threshold: number;
}

const PREDICATE_OPTIONS = [
  "has_indicator", "has_ttp", "has_malware", "has_threat_actor",
  "has_domain", "has_ip", "has_hash", "has_cve", "all_of", "any_of",
];

interface Props {
  initialContent?: string;
  onChange: (yaml: string) => void;
}

function toYAML(rule: YAMLRule): string {
  const conditions = rule.conditions
    .map((c) => `  - ${c.predicate}(${c.args})`)
    .join("\n");
  return [
    `name: ${rule.name}`,
    `engine: yaml`,
    `tlp_ceiling: ${rule.tlp_ceiling}`,
    `confidence_threshold: ${rule.confidence_threshold}`,
    `conditions:`,
    conditions,
    `action: ${rule.action}`,
  ].join("\n");
}

export function YAMLFormBuilder({ onChange }: Props) {
  const [rule, setRule] = useState<YAMLRule>({
    name: "",
    engine: "yaml",
    conditions: [{ predicate: "has_indicator", args: "" }],
    action: "fire",
    tlp_ceiling: "AMBER",
    confidence_threshold: 0.5,
  });

  function update(patch: Partial<YAMLRule>) {
    const next = { ...rule, ...patch };
    setRule(next);
    onChange(toYAML(next));
  }

  function updateCondition(i: number, patch: Partial<Condition>) {
    const conditions = rule.conditions.map((c, j) => (j === i ? { ...c, ...patch } : c));
    update({ conditions });
  }

  function addCondition() {
    update({ conditions: [...rule.conditions, { predicate: "has_indicator", args: "" }] });
  }

  function removeCondition(i: number) {
    update({ conditions: rule.conditions.filter((_, j) => j !== i) });
  }

  return (
    <div className="space-y-4 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs font-medium">Rule name</label>
          <input
            value={rule.name}
            onChange={(e) => update({ name: e.target.value })}
            className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            placeholder="e.g. detect_c2_domain"
          />
        </div>
        <div>
          <label className="text-xs font-medium">TLP ceiling</label>
          <select
            value={rule.tlp_ceiling}
            onChange={(e) => update({ tlp_ceiling: e.target.value })}
            className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
          >
            {["WHITE", "GREEN", "AMBER", "AMBER+STRICT", "RED"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium">
            Confidence threshold ({Math.round(rule.confidence_threshold * 100)}%)
          </label>
          <input
            type="range" min={0} max={1} step={0.05}
            value={rule.confidence_threshold}
            onChange={(e) => update({ confidence_threshold: parseFloat(e.target.value) })}
            className="mt-1 w-full"
          />
        </div>
        <div>
          <label className="text-xs font-medium">Action</label>
          <select
            value={rule.action}
            onChange={(e) => update({ action: e.target.value })}
            className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
          >
            {["fire", "alert", "suppress"].map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium">Conditions</label>
          <button onClick={addCondition} className="text-xs text-muted-foreground hover:text-foreground">
            + Add condition
          </button>
        </div>
        <div className="space-y-2">
          {rule.conditions.map((cond, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select
                value={cond.predicate}
                onChange={(e) => updateCondition(i, { predicate: e.target.value })}
                className="rounded border px-2 py-1 text-sm"
              >
                {PREDICATE_OPTIONS.map((p) => <option key={p}>{p}</option>)}
              </select>
              <input
                value={cond.args}
                onChange={(e) => updateCondition(i, { args: e.target.value })}
                placeholder="args..."
                className="flex-1 rounded border px-2 py-1 text-sm"
              />
              {rule.conditions.length > 1 && (
                <button onClick={() => removeCondition(i)} className="text-xs text-destructive">✕</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <pre className="rounded bg-muted p-3 text-xs overflow-auto">{toYAML(rule)}</pre>
    </div>
  );
}

const PREDICATES = [
  { name: "has_indicator", sig: "(type, value)", desc: "Checks for a matching indicator IOC" },
  { name: "has_ttp", sig: "(technique_id)", desc: "Checks for ATT&CK technique presence" },
  { name: "has_malware", sig: "(name)", desc: "Checks for named malware family" },
  { name: "has_threat_actor", sig: "(name)", desc: "Checks for attributed threat actor" },
  { name: "has_campaign", sig: "(name)", desc: "Checks for associated campaign" },
  { name: "has_domain", sig: "(domain)", desc: "Checks for domain indicator" },
  { name: "has_ip", sig: "(ip)", desc: "Checks for IP address indicator" },
  { name: "has_hash", sig: "(algo, value)", desc: "Checks for file hash" },
  { name: "has_email", sig: "(address)", desc: "Checks for email indicator" },
  { name: "has_url", sig: "(url)", desc: "Checks for URL indicator" },
  { name: "has_cve", sig: "(cve_id)", desc: "Checks for CVE reference" },
  { name: "has_platform", sig: "(platform)", desc: "Checks evidence source platform" },
  { name: "tlp_at_most", sig: "(tlp_level)", desc: "Enforces TLP ceiling" },
  { name: "confidence_above", sig: "(threshold)", desc: "Confidence score threshold" },
  { name: "observed_after", sig: "(timestamp)", desc: "Time-bound evidence check" },
  { name: "observed_before", sig: "(timestamp)", desc: "Time-bound evidence check" },
  { name: "stix_type", sig: "(type)", desc: "Checks for a specific STIX SDO type" },
  { name: "stix_rel", sig: "(src, rel, dst)", desc: "Checks for a STIX relationship" },
  { name: "count_indicators", sig: "(min, max?)", desc: "Asserts indicator count range" },
  { name: "all_of", sig: "([pred, ...])", desc: "All sub-predicates must match" },
  { name: "any_of", sig: "([pred, ...])", desc: "At least one sub-predicate must match" },
  { name: "none_of", sig: "([pred, ...])", desc: "No sub-predicates may match" },
  { name: "not", sig: "(pred)", desc: "Negation of a predicate" },
  { name: "hypothesis_has_tag", sig: "(tag)", desc: "Checks hypothesis tag" },
  { name: "investigation_status", sig: "(status)", desc: "Checks investigation state" },
  { name: "audit_ceiling", sig: "(score)", desc: "Enforces AI-60 audit ceiling" },
];

interface Props {
  onInsert: (text: string) => void;
}

export function PredicatePalette({ onInsert }: Props) {
  return (
    <div className="h-full overflow-y-auto border-l p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Predicates ({PREDICATES.length})
      </h3>
      <div className="space-y-1">
        {PREDICATES.map((p) => (
          <button
            key={p.name}
            onClick={() => onInsert(`${p.name}${p.sig}`)}
            className="w-full rounded p-2 text-left hover:bg-accent"
          >
            <p className="font-mono text-xs font-medium">
              {p.name}
              <span className="text-muted-foreground">{p.sig}</span>
            </p>
            <p className="text-xs text-muted-foreground">{p.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

# Rule predicates reference

All 26 predicates are available in every rule engine (YAML DSL, Hy, Prolog). In YAML and Hy they are called as functions; in Prolog they map to built-in Prolog terms backed by GNAT's fact store.

---

## IOC / indicator predicates

### `has_indicator(type, value)`
Checks for a matching indicator IOC.

- `type` — STIX pattern type, e.g. `domain`, `ip`, `url`, `hash`, `email`
- `value` — exact value to match, or `*` to match any value of that type

```yaml
- has_indicator(domain, evil.example.com)
- has_indicator(ip, *)         # any IP indicator
```

### `has_domain(domain)`
Shorthand for `has_indicator(domain, <domain>)`.

```yaml
- has_domain(evil.example.com)
```

### `has_ip(ip)`
Shorthand for `has_indicator(ip, <ip>)`.

```yaml
- has_ip(198.51.100.42)
```

### `has_hash(algo, value)`
Checks for a file hash indicator.

- `algo` — `md5`, `sha1`, `sha256`, `sha512`
- `value` — hex digest, or `*`

```yaml
- has_hash(sha256, d41d8cd98f00b204e9800998ecf8427e)
```

### `has_email(address)`
Checks for an email address indicator.

```yaml
- has_email(phishing@evil.example.com)
```

### `has_url(url)`
Checks for a URL indicator.

```yaml
- has_url(https://evil.example.com/payload)
```

### `has_cve(cve_id)`
Checks for a CVE reference. Use `*` to match any CVE.

```yaml
- has_cve(CVE-2024-12345)
- has_cve(*)
```

---

## Threat intelligence predicates

### `has_ttp(technique_id)`
Checks for the presence of an ATT&CK technique. Accepts full technique IDs including sub-techniques.

```yaml
- has_ttp(T1566)        # Phishing
- has_ttp(T1566.001)    # Spearphishing Attachment
```

### `has_malware(name)`
Checks for a named malware family. Use `*` to match any malware node.

```yaml
- has_malware(Emotet)
- has_malware(*)
```

### `has_threat_actor(name)`
Checks for an attributed threat actor. Use `*` to match any.

```yaml
- has_threat_actor(APT28)
```

### `has_campaign(name)`
Checks for an associated campaign node.

```yaml
- has_campaign(Operation Warp Speed)
```

### `has_platform(platform)`
Checks the platform of evidence source nodes (e.g. `windows`, `linux`, `macos`).

```yaml
- has_platform(windows)
```

---

## STIX structural predicates

### `stix_type(type)`
Checks that at least one node of the given STIX SDO type exists in the graph.

```yaml
- stix_type(attack-pattern)
- stix_type(malware)
```

### `stix_rel(src, rel, dst)`
Checks for a STIX SRO (relationship) matching the pattern. Use `*` as wildcard for any field.

```yaml
- stix_rel(malware, uses, attack-pattern)
- stix_rel(*, related-to, *)
```

### `count_indicators(min, max?)`
Asserts that the number of indicator nodes falls within the given range. `max` is optional (unbounded if omitted).

```yaml
- count_indicators(3)        # at least 3 indicators
- count_indicators(2, 10)    # between 2 and 10 inclusive
```

---

## Scoring and classification predicates

### `confidence_above(threshold)`
Passes if the minimum confidence score across all nodes is above the given threshold (0.0–1.0).

```yaml
- confidence_above(0.6)
```

### `tlp_at_most(tlp_level)`
Enforces a TLP ceiling. Passes if no node has a marking above the given level.

- Levels in ascending order: `white`, `green`, `amber`, `amber+strict`, `red`

```yaml
- tlp_at_most(amber)
```

### `audit_ceiling(score)`
Enforces the AI-60 audit ceiling. Passes if the investigation's AI confidence score does not exceed `score` (0–100).

```yaml
- audit_ceiling(60)
```

---

## Metadata predicates

### `hypothesis_has_tag(tag)`
Checks that at least one hypothesis on the investigation carries the given tag.

```yaml
- hypothesis_has_tag(attribution)
```

### `investigation_status(status)`
Checks the investigation's current state.

- Valid values: `draft`, `active`, `materialised`, `archived`

```yaml
- investigation_status(active)
```

### `observed_after(timestamp)`
Checks that at least one piece of evidence was observed after the given ISO 8601 timestamp.

```yaml
- observed_after(2024-01-01T00:00:00Z)
```

### `observed_before(timestamp)`
Checks that all evidence was observed before the given timestamp.

```yaml
- observed_before(2024-12-31T23:59:59Z)
```

---

## Logical combinators

### `all_of([pred, ...])`
All sub-predicates must match. Equivalent to AND.

```yaml
conditions:
  all_of:
    - has_malware(*)
    - has_ttp(*)
    - confidence_above(0.5)
```

### `any_of([pred, ...])`
At least one sub-predicate must match. Equivalent to OR.

```yaml
conditions:
  any_of:
    - has_malware(Emotet)
    - has_malware(Qakbot)
```

### `none_of([pred, ...])`
No sub-predicates may match. Equivalent to NOT (any_of …).

```yaml
conditions:
  none_of:
    - tlp_at_most(white)    # exclude white-marked investigations
```

### `not(pred)`
Negation of a single predicate.

```yaml
- not(has_platform(linux))
```

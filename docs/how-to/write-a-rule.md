# Write a detection rule

GNAT-gui supports three rule engines. This guide shows practical examples in each and explains when to choose each engine.

---

## Choosing an engine

| Engine | Choose when |
|---|---|
| **YAML DSL** | You want a readable, declarative rule that non-programmers can review |
| **Hy** | You need programmatic logic, iteration, or access to GNAT Python objects directly |
| **Prolog** | You are expressing relational/deductive properties over graph structure |

All engines share the same predicate vocabulary. See the [Rule predicates reference](../reference/rule-predicates.md) for the full list.

---

## YAML DSL

### Structure

```yaml
name: <rule-name>
description: <human-readable description>
severity: low | medium | high | critical
tags:
  - <tag1>
  - <tag2>

conditions:
  <predicate>  # single predicate or combinator
```

### Combinators

```yaml
conditions:
  all_of:          # AND — all sub-conditions must match
    - <pred1>
    - <pred2>
  any_of:          # OR — at least one must match
    - <pred1>
    - <pred2>
  none_of:         # NOT IN — none may match
    - <pred1>
```

Combinators nest freely:

```yaml
conditions:
  all_of:
    - has_ttp(T1566.001)
    - any_of:
        - has_malware(Emotet)
        - has_malware(Qakbot)
    - confidence_above(0.5)
```

### Example: CVE exploitation with threat actor attribution

```yaml
name: cve-exploitation-attributed
description: >
  Flags an investigation where a CVE indicator co-exists with
  a threat actor attribution at moderate-or-higher confidence.
severity: critical
tags:
  - exploitation
  - attribution

conditions:
  all_of:
    - has_cve(*)
    - has_threat_actor(*)
    - confidence_above(0.5)
    - tlp_at_most(red)
```

### Example: YAML form builder

The **YAML form builder** tab in the rule editor provides a GUI that generates YAML. Use it when you prefer clicking over typing; it covers all combinators and predicates.

---

## Hy

Hy rules are Lisp-syntax Python. The rule function receives a GNAT `Investigation` object and must return `True` (match) or `False` (no match).

### Structure

```hy
(defn match [investigation]
  ;; return True to flag, False to pass
  )
```

### Example: phishing domain with high indicator count

```hy
(defn match [investigation]
  (let [indicators (.get-indicators investigation)
        domains (lfor i indicators :if (= (. i type) "domain-name") i)]
    (and
      (> (len domains) 3)
      (any (lfor i indicators :if (= (. i type) "malware") True))
      (> (.min-confidence investigation) 0.6))))
```

### Accessing GNAT objects

The `investigation` object exposes:

- `.get-indicators()` — list of STIX indicator objects
- `.get-nodes()` — all graph nodes
- `.get-edges()` — all graph edges
- `.min-confidence()` — minimum confidence score across all nodes
- `.get-stix-objects(type)` — filter nodes by STIX type

---

## Prolog

Prolog rules express deductive properties. GNAT exposes the investigation graph as a set of Prolog facts.

### Available facts

```prolog
% node(ID, Type)           — a STIX object exists
% edge(SrcID, Rel, DstID)  — a relationship exists
% confidence(ID, Score)    — confidence score for an object
% marking(ID, TLP)         — TLP marking for an object
% property(ID, Key, Value) — a STIX property value
```

### Structure

A Prolog rule file must define a `match/1` predicate that succeeds if the investigation should be flagged:

```prolog
match(Investigation) :-
    % body clauses using the built-in facts
    .
```

### Example: lateral movement with credential access

```prolog
% Flag if there is a chain: initial access → lateral movement → credential access

match(_) :-
    node(A, 'attack-pattern'),
    property(A, 'external_id', 'T1078'),       % Valid Accounts (initial access)
    node(B, 'attack-pattern'),
    property(B, 'external_id', 'T1021'),       % Remote Services (lateral movement)
    node(C, 'attack-pattern'),
    property(C, 'external_id', 'T1003'),       % OS Credential Dumping
    edge(A, 'related-to', B),
    edge(B, 'related-to', C).
```

### Example: isolated high-confidence indicator

```prolog
% Flag if a high-confidence indicator has no outbound relationships

isolated_indicator(ID) :-
    node(ID, 'indicator'),
    confidence(ID, Score),
    Score > 0.8,
    \+ edge(ID, _, _).

match(_) :- isolated_indicator(_).
```

---

## Saving and testing

After writing a rule in any engine, click **Save** (stores as `draft`), then open the **Test** tab to run it against a STIX bundle fixture. See the [Your first rule tutorial](../tutorials/first-rule.md) for a step-by-step test walkthrough.

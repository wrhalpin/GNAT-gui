# Your first detection rule

This tutorial walks through creating a YAML detection rule, testing it against a fixture, reviewing the audit trail, and (for senior analysts) promoting it to the shared rule library.

**What you will have at the end:** a saved, tested detection rule that is visible to your team.

---

## Background

GNAT-gui supports three rule engines. You will use the YAML DSL in this tutorial because it is the most approachable for newcomers. The [Write a detection rule how-to](../how-to/write-a-rule.md) covers all three engines with more complex examples.

| Engine | Best for |
|---|---|
| YAML DSL | Human-readable, form-driven rules |
| Hy | Programmatic rules with full Hy/Python expressiveness |
| Prolog | Relational/deductive rules over graph structure |

---

## Step 1 — Navigate to Rules

Click **Rules** in the sidebar. The page shows the rule library, initially empty.

---

## Step 2 — Create a new rule

Click **New Rule**. A form appears with two fields:

- **Rule name** — enter `phishing-domain-with-malware`
- **Engine** — choose **YAML**

The Monaco editor opens with a blank YAML template.

---

## Step 3 — Write the rule

Replace the template content with:

```yaml
name: phishing-domain-with-malware
description: >
  Flags investigations where a phishing domain indicator is co-present
  with a malware family reference, with confidence above 0.6.
severity: high
tags:
  - phishing
  - malware

conditions:
  all_of:
    - has_indicator(domain, *)
    - has_malware(*)
    - confidence_above(0.6)
    - tlp_at_most(amber)
```

The **Predicate palette** on the right lists all 26 available predicates. Click any predicate name to insert it at the cursor position.

---

## Step 4 — Save the rule

Click **Save**. The rule is stored with status `draft`. An audit event is recorded.

---

## Step 5 — Run the test runner

Click the **Test** tab at the top of the rule editor.

The test runner expects a JSON *fixture*: a STIX bundle representing the investigation graph you want the rule to evaluate against.

Paste this minimal fixture into the fixture input area:

```json
{
  "type": "bundle",
  "id": "bundle--test",
  "objects": [
    {
      "type": "indicator",
      "id": "indicator--1",
      "pattern": "[domain-name:value = 'evil.example.com']",
      "pattern_type": "stix",
      "indicator_types": ["malicious-activity"],
      "confidence": 80,
      "object_marking_refs": ["marking-definition--amber"]
    },
    {
      "type": "malware",
      "id": "malware--1",
      "name": "Emotet",
      "malware_types": ["trojan"],
      "confidence": 75
    }
  ]
}
```

Click **Run Test**. A progress bar appears while GNAT evaluates the rule. When it completes, you see:

```
Result: MATCH
  ✓ has_indicator(domain, *) — matched indicator--1
  ✓ has_malware(*)           — matched Emotet
  ✓ confidence_above(0.6)    — min confidence 0.75
  ✓ tlp_at_most(amber)       — all objects ≤ amber
```

Try changing `confidence_above(0.6)` to `confidence_above(0.9)` and running again — you should get `NO MATCH` because the minimum confidence is 0.75.

---

## Step 6 — Review the audit trail

Click the **Audit** tab. You will see a timestamped log of every action taken on this rule:

```
2026-04-25 14:03:11  analyst       rule.created    phishing-domain-with-malware
2026-04-25 14:07:44  analyst       rule.tested     phishing-domain-with-malware  result=match
2026-04-25 14:08:01  analyst       rule.tested     phishing-domain-with-malware  result=no_match
```

The audit trail is append-only and cannot be edited.

---

## Step 7 — Promote to shared library (senior analyst only)

If your account has the `senior_analyst` or `admin` role, a **Promote** button appears in the rule editor header.

Clicking **Promote** changes the rule status from `draft` to `active` and makes it visible to all analysts. A `rule.promoted` audit event is recorded with your username.

If you are logged in as `analyst`, the Promote button is hidden. Ask a senior analyst to promote the rule after review.

---

## What's next?

- See the [Write a detection rule how-to](../how-to/write-a-rule.md) for Hy and Prolog examples and more complex YAML patterns
- See the full [Rule predicates reference](../reference/rule-predicates.md) for all 26 predicates with signatures and examples
- Read the [Rules Builder module spec](../module-specs/rules-builder.md) for the complete API and data model

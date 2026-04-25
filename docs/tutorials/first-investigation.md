# Your first investigation

This tutorial walks through creating an evidence graph from scratch, exploring its nodes, adding a hypothesis, and scoring it using the NATO Admiralty Scale. It assumes you have a running GNAT-gui instance and are logged in as a user with the `analyst` role or above.

**What you will have at the end:** a seeded investigation graph with at least one scored hypothesis.

---

## Overview

An *investigation* in GNAT is a directed evidence graph built by the 5-step pipeline:

1. **Seed** — provide one or more starting IOCs or STIX objects
2. **Expand** — GNAT enriches each node by querying configured sources
3. **Normalise** — raw enrichment is mapped to STIX 2.1 SDOs and SROs
4. **Correlate** — relationships between objects are computed and weighted
5. **Materialise** — the completed graph is written to the GNAT workspace (requires `senior_analyst` or above)

You will run steps 1–4 in this tutorial. Materialisation is covered in the [Investigations module spec](../module-specs/investigations.md).

---

## Step 1 — Navigate to Investigations

Click **Investigations** in the sidebar. The page shows your existing investigations (empty for a fresh install).

---

## Step 2 — Start a new investigation

Click **New Investigation**. The seed picker page opens.

The seed picker accepts several seed types:

| Type | Example |
|---|---|
| Domain | `evil.example.com` |
| IP address | `198.51.100.42` |
| File hash (MD5/SHA-1/SHA-256) | `d41d8cd98f00b204e9800998ecf8427e` |
| CVE identifier | `CVE-2024-12345` |
| STIX ID | `indicator--<uuid>` |

Enter a seed value (use a domain name for this tutorial) and click **Build Investigation**.

---

## Step 3 — Watch the build progress

A progress bar appears and updates in real time via a server-sent event (SSE) stream. The five pipeline stages are reported as the job runs:

```
Seeding…          0%
Expanding…       10%
Normalising…     50%
Correlating…     80%
Finalising…      95%
Done             100%
```

When the progress bar reaches 100 %, you are automatically redirected to the graph canvas.

---

## Step 4 — Explore the graph

The graph canvas shows STIX objects as nodes and relationships as edges.

**Node types** are colour-coded by STIX SDO type (indicator, malware, threat-actor, campaign, vulnerability, …).

**Edge types** are filtered by the panel on the right. Try:

- Toggling edge types on and off with the **Edge filter**
- Adjusting the **confidence threshold** slider to hide low-confidence relationships
- Clicking the **Legend** button to see what each colour means

**Zooming and panning:** use the mouse wheel to zoom, click-drag to pan. Use the minimap in the bottom-right corner to navigate large graphs.

---

## Step 5 — Inspect a node

Click any node to open the **node detail drawer** on the right. This shows the full STIX object JSON, including:

- Object type, ID, and creation timestamp
- All STIX properties for that object type
- Confidence score and TLP marking
- Related objects (expandable list)

---

## Step 6 — Expand a node

In the node detail drawer, click **Expand node** to run additional enrichment on that specific node. This submits a new job and opens a progress indicator. New nodes and edges appear on the graph when the job completes.

---

## Step 7 — Add a hypothesis

Navigate to **Analysis** in the sidebar, then open the investigation (it appears in the list). Click **New Hypothesis**.

Fill in:

- **Title** — a concise statement, e.g. "APT-X is targeting financial sector via spearphishing"
- **Description** — supporting detail and reasoning
- **Source reliability** — select A–F on the NATO Admiralty Scale (see [Admiralty Scale reference](../reference/admiralty-scale.md))
- **Information credibility** — select 1–6

Click **Save**.

---

## Step 8 — Review the hypothesis card

The hypothesis card appears in the investigation detail view with a badge showing the Admiralty Scale score. The combined rating (e.g. **B2**, **C3**) reflects your assessment of both the source and the information quality.

You can add notes, update the score as new evidence arrives, or create additional hypotheses to represent competing theories.

---

## What's next?

- Learn how to [write detection rules](first-rule.md) that can flag graph nodes matching patterns
- Learn how to [run AI gap detection](../how-to/run-gap-detection.md) to find evidentiary weaknesses in an investigation
- Read the [Investigations module spec](../module-specs/investigations.md) for the full pipeline and API details

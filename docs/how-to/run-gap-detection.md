# Run AI gap detection and report drafting

GNAT-gui integrates two AI-assisted analysis tools that run as asynchronous jobs and stream results back in real time:

- **Gap detection** — identifies evidentiary weaknesses in an investigation using the GNAT `GapDetector`
- **Report drafting** — produces a structured analytical report draft using the GNAT `ReportDraftingAssistant` and an LLM

Both tools require at least the `analyst` role. Report publishing requires `senior_analyst`.

---

## Prerequisites

For report drafting you need an Anthropic API key configured:

```dotenv
GNAT_GUI_LLM_API_KEY=sk-ant-...
GNAT_GUI_LLM_MODEL=claude-sonnet-4-6   # optional, this is the default
```

Gap detection is rule-based and works without an LLM key.

---

## Run gap detection

1. Open an investigation in the **Analysis** module (`/analysis/:id`)
2. In the right panel, click **Gap Detection**
3. The job is submitted and a progress bar appears

   Progress events stream via SSE:
   ```
   Initialising…       0%
   Analysing nodes…   25%
   Checking coverage… 60%
   Scoring gaps…      85%
   Complete          100%
   ```

4. When complete, results appear as a list of gap items:

   | Field | Meaning |
   |---|---|
   | **Gap type** | Category: `temporal`, `attribution`, `corroboration`, `coverage` |
   | **Description** | What is missing or uncertain |
   | **Severity** | `low`, `medium`, `high` |
   | **Affected nodes** | STIX IDs of related objects |
   | **Suggested action** | What additional collection or analysis would address the gap |

5. Click any gap item to highlight the affected nodes on the graph canvas

---

## Request a report draft

1. From the same investigation detail view, click **Draft Report**
2. A dialog asks for:
   - **Report type** — `tactical`, `operational`, or `strategic`
   - **Classification** — TLP ceiling for the report
3. Click **Generate**. The job is submitted and a progress indicator appears.

   The report is generated incrementally; text appears as it is produced:
   ```
   Structuring report…   10%
   Writing executive summary…   30%
   Analysing findings…   60%
   Writing conclusions…  80%
   Done                 100%
   ```

4. When complete, the report appears in a rich-text panel with sections:
   - Executive summary
   - Key findings
   - Evidence base
   - Gaps and caveats
   - Analytical judgements
   - Recommendations

---

## Edit and publish the draft

The report draft is editable in the panel before publishing.

- **Senior analysts** see a **Publish** button, which marks the report as `published` and records a `report.published` audit event.
- **Analysts** can save draft edits but cannot publish.

---

## Re-running analysis

You can re-run gap detection or report drafting at any time as the investigation evolves. Each run creates a new job; previous results are stored and can be accessed via the job history in the jobs panel.

---

## Troubleshooting

**Gap detection returns empty results**
The investigation graph may be too small (fewer than 3 nodes). Add more evidence by expanding nodes before running gap detection.

**Report drafting fails with "LLM not configured"**
Set `GNAT_GUI_LLM_API_KEY` in your environment and restart the backend.

**Progress bar stalls at a percentage**
The SSE stream may have been interrupted. Refresh the page; the job continues running in the background and results are available via the job poll endpoint (`GET /api/jobs/:id`).

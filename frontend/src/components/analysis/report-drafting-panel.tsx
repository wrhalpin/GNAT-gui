import { useState } from "react";
import { useSubmitDraftReport, usePublishReport } from "@/api/queries/analysis";
import { usePermission } from "@/lib/rbac";
import { openJobStream, type StreamEvent } from "@/lib/sse";

const REPORT_TYPES = ["tactical", "operational", "strategic"];
const TLP_LEVELS = ["white", "green", "amber", "amber+strict", "red"];

export function ReportDraftingPanel({ investigationId }: { investigationId: string }) {
  const submit = useSubmitDraftReport(investigationId);
  const publish = usePublishReport();
  const canPublish = usePermission("report.publish");

  const [reportType, setReportType] = useState("tactical");
  const [tlp, setTlp] = useState("amber");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [reportText, setReportText] = useState("");
  const [reportId, setReportId] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setError(null);
    setReportText("");
    setReportId(null);
    setPublished(false);
    setProgress(0);
    setRunning(true);
    try {
      const { job_id } = await submit.mutateAsync({ report_type: reportType, tlp });
      openJobStream(
        job_id,
        (evt: StreamEvent) => {
          if (evt.type === "progress") {
            setProgress(evt.progress ?? 0);
            setMessage(evt.message ?? "");
          }
          // The drafting job streams incremental text via token/result events.
          if (evt.type === "token" && evt.text) {
            setReportText((prev) => prev + evt.text);
          }
        },
        (done) => {
          const result = (done.result ?? {}) as { report_id?: string; text?: string };
          if (result.report_id) setReportId(result.report_id);
          if (result.text) setReportText(result.text);
          setRunning(false);
        },
        (msg) => {
          setError(msg || "Report drafting failed");
          setRunning(false);
        }
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start");
      setRunning(false);
    }
  }

  async function doPublish() {
    if (!reportId) return;
    setError(null);
    try {
      await publish.mutateAsync(reportId);
      setPublished(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
    }
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h3 className="text-sm font-medium">Report Drafting</h3>

      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs">
          <span className="mb-1 block text-muted-foreground">Type</span>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="rounded border px-2 py-1.5 text-sm"
          >
            {REPORT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="mb-1 block text-muted-foreground">Classification (TLP)</span>
          <select
            value={tlp}
            onChange={(e) => setTlp(e.target.value)}
            className="rounded border px-2 py-1.5 text-sm"
          >
            {TLP_LEVELS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={generate}
          disabled={running}
          className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
        >
          {running ? "Generating..." : "Generate"}
        </button>
      </div>

      {running && (
        <div className="space-y-1">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {reportText && (
        <div className="space-y-2">
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            className="h-64 w-full rounded border p-2 font-mono text-xs"
          />
          <div className="flex items-center gap-2">
            {canPublish && reportId && !published && (
              <button
                onClick={doPublish}
                disabled={publish.isPending}
                className="rounded bg-green-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
              >
                {publish.isPending ? "Publishing..." : "Publish"}
              </button>
            )}
            {published && <span className="text-sm text-green-700">Published ✓</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export interface StreamEvent {
  type: "progress" | "token" | "result" | "error" | "done";
  progress?: number;
  message?: string;
  text?: string;
  result?: Record<string, unknown>;
  error?: string;
  status?: string;
}

/**
 * Open an SSE stream for a job. Resolves the following robustness issues:
 * - EventSource auto-reconnects on transient errors; we only treat an error as
 *   terminal once the connection is CLOSED, so a proxy blip doesn't kill a long job.
 * - Malformed lines (e.g. keep-alive comments) never throw inside the handler.
 * - A `done` event with a failed/cancelled status is surfaced through onError, so a
 *   failed job doesn't leave the UI stuck on a half-full progress bar.
 */
export function openJobStream(
  jobId: string,
  onEvent: (evt: StreamEvent) => void,
  onDone: (evt: StreamEvent) => void,
  onError: (err: string) => void
): EventSource {
  const es = new EventSource(`/api/jobs/${jobId}/stream`, { withCredentials: true });

  es.onmessage = (e) => {
    let evt: StreamEvent;
    try {
      evt = JSON.parse(e.data);
    } catch {
      return; // ignore non-JSON payloads (keep-alives, partial frames)
    }
    onEvent(evt);

    if (evt.type === "error") {
      onError(evt.error ?? "Stream error");
      return;
    }

    if (evt.type === "done") {
      es.close();
      if (evt.status && evt.status !== "success" && evt.status !== "succeeded") {
        onError(evt.error ?? `Job ${evt.status}`);
      } else {
        onDone(evt);
      }
    }
  };

  es.onerror = () => {
    // Only give up once the browser has actually closed the connection; while it is
    // CONNECTING the EventSource is retrying on its own.
    if (es.readyState === EventSource.CLOSED) {
      onError("Connection lost");
    }
  };

  return es;
}

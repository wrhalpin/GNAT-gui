export interface StreamEvent {
  type: "progress" | "token" | "result" | "error" | "done";
  progress?: number;
  message?: string;
  text?: string;
  result?: Record<string, unknown>;
  error?: string;
  status?: string;
}

export function openJobStream(
  jobId: string,
  onEvent: (evt: StreamEvent) => void,
  onDone: () => void,
  onError: (err: Event) => void
): EventSource {
  const es = new EventSource(`/api/jobs/${jobId}/stream`, { withCredentials: true });

  es.onmessage = (e) => {
    const evt: StreamEvent = JSON.parse(e.data);
    onEvent(evt);
    if (evt.type === "done") {
      es.close();
      onDone();
    }
  };

  es.onerror = (e) => {
    es.close();
    onError(e);
  };

  return es;
}

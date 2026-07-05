const BASE = "";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

/** Read a cookie value by name (used for the double-submit CSRF token). */
function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  // CSRF double-submit: echo the `csrftoken` cookie in the `x-csrftoken` header on
  // every unsafe request. The backend CSRFMiddleware sets that cookie (JS-readable)
  // on responses; without this header every mutation would 403.
  if (!SAFE_METHODS.has(method)) {
    const csrf = readCookie("csrftoken");
    if (csrf) headers["x-csrftoken"] = csrf;
  }

  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...init,
    headers,
  });

  // Redirect to login on auth failure — but not for the login request itself, so the
  // login form can surface "invalid credentials" instead of silently reloading.
  if (res.status === 401 && !path.startsWith("/api/auth/login")) {
    window.location.href = "/login";
    throw new Error("Unauthenticated");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

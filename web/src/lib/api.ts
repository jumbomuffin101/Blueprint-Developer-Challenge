const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

export type EncryptBody = { key: string; data: string };
export type DecryptBody = { key: string; data: string };
export type DataResponse = { data: string };
export type LogItem = { id: string; timestamp: number; ip: string; data: string };
export type LogsResponse = { items: LogItem[] };

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const b: unknown = await res.json();
      if (typeof b === "object" && b && "detail" in b) {
        const detail = (b as { detail?: unknown }).detail;
        if (typeof detail === "string") msg = detail;
      }
    } catch { /* ignore parse errors */ }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

async function raw(path: string, init?: RequestInit): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const b: unknown = await res.json();
      if (typeof b === "object" && b && "detail" in b) {
        const detail = (b as { detail?: unknown }).detail;
        if (typeof detail === "string") msg = detail;
      }
    } catch { /* ignore parse errors */ }
    throw new Error(msg);
  }
}

export const api = {
  encrypt: (body: EncryptBody) =>
    json<DataResponse>("/api/v1/encrypt", { method: "POST", body: JSON.stringify(body) }),

  decrypt: (body: DecryptBody) =>
    json<DataResponse>("/api/v1/decrypt", { method: "POST", body: JSON.stringify(body) }),

  logs: (size = 10, offset = 0) =>
    json<LogsResponse>(`/api/v1/logs?size=${size}&offset=${offset}`),

  clearLogs: () => raw("/api/v1/logs", { method: "DELETE" }),

  health: () => json<{ status: string }>("/health"),
};

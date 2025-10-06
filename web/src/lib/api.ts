const API_BASE = "http://127.0.0.1:8000";

export type EncryptBody = { key: string; data: string };
export type DecryptBody = { key: string; data: string };
export type DataResponse = { data: string };

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try { const b = await res.json(); msg = (b as any)?.detail ?? msg; } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

async function raw(path: string, init?: RequestInit): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    let msg = res.statusText;
    try { const b = await res.json(); msg = (b as any)?.detail ?? msg; } catch {}
    throw new Error(msg);
  }
}

export const api = {
  encrypt: (body: EncryptBody) => json<DataResponse>("/api/v1/encrypt", { method: "POST", body: JSON.stringify(body) }),
  decrypt: (body: DecryptBody) => json<DataResponse>("/api/v1/decrypt", { method: "POST", body: JSON.stringify(body) }),
  logs:    (size = 10, offset = 0) => json<{ items: { id: string; timestamp: number; ip: string; data: string }[] }>(`/api/v1/logs?size=${size}&offset=${offset}`),
  clearLogs: () => raw("/api/v1/logs", { method: "DELETE" }),
  health:  () => json<{ status: string }>("/health"),
};

import { useEffect, useMemo, useState } from "react";
import { api, type LogItem } from "../lib/api";
import { toMessage } from "../lib/errors";

export default function LogsPage() {
  const [items, setItems] = useState<LogItem[]>([]);
  const [size, setSize] = useState(10);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [q, setQ] = useState("");

  const load = async (append = false) => {
    setLoading(true);
    setError("");
    setOk("");
    try {
      const res = await api.logs(size, offset);
      setItems((prev) => (append ? [...prev, ...res.items] : res.items));
    } catch (err: unknown) {
      setError(toMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onClear = async () => {
    if (!confirm("Clear ALL logs? This cannot be undone.")) return;
    setLoading(true);
    setError("");
    setOk("");
    try {
      await api.clearLogs();
      setOk("Logs cleared.");
      setItems([]);
      setOffset(0);
    } catch (err: unknown) {
      setError(toMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, offset]);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    if (!text) return items;
    return items.filter((r) =>
      r.id.toLowerCase().includes(text) ||
      r.ip.toLowerCase().includes(text) ||
      r.data.toLowerCase().includes(text) ||
      new Date(r.timestamp * 1000).toLocaleString().toLowerCase().includes(text)
    );
  }, [items, q]);

  const onLoadMore = async () => {
    const nextOffset = offset + size;
    setOffset(nextOffset);
    setLoading(true);
    try {
      const res = await api.logs(size, nextOffset);
      setItems((prev) => [...prev, ...res.items]);
    } catch (err: unknown) {
      setError(toMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h1 className="title">Logs</h1>

      <div className="controls">
        <label>
          Size
          <input
            type="number"
            value={size}
            min={1}
            max={100}
            onChange={(e) => {
              setItems([]);
              setOffset(0);
              setSize(Number(e.target.value) || 10);
            }}
          />
        </label>
        <label>
          Offset
          <input
            type="number"
            value={offset}
            min={0}
            onChange={(e) => {
              setItems([]);
              setOffset(Number(e.target.value) || 0);
            }}
          />
        </label>
        <button className="btn" onClick={() => void load(false)} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
        <button className="btn danger" onClick={() => void onClear()} disabled={loading}>
          Clear Logs
        </button>
      </div>

      <div className="search">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by id, ip, data, or date…"
        />
        <button className="iconbtn" onClick={() => setQ("")} disabled={!q}>
          Reset
        </button>
      </div>

      {error && <p className="alert error">Error: {error}</p>}
      {ok && <p className="alert ok">{ok}</p>}

      <div className="tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>IP</th>
              <th>Data</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={4}>No logs</td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.timestamp * 1000).toLocaleString()}</td>
                <td>{r.ip}</td>
                <td>{r.data}</td>
                <td className="mono">{r.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="btn secondary" onClick={() => void onLoadMore()} disabled={loading}>
          Load more
        </button>
        <button
          className="btn"
          onClick={() => {
            setOffset(0);
            setItems([]);
            void load(false);
          }}
          disabled={loading}
        >
          Top
        </button>
      </div>
    </div>
  );
}
